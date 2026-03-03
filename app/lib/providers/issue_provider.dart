import 'dart:io';
import 'package:flutter/material.dart';
import '../models/issue_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class IssueProvider with ChangeNotifier {
  final ApiService _apiService;
  final SocketService _socketService;
  final String? _userId;

  List<Issue> _allIssues = [];
  bool _isLoading = false;
  String? _error;
  bool _isSubmitting = false;

  IssueProvider(this._apiService, this._socketService, this._userId) {
    _setupSocketListeners();
  }

  List<Issue> get allIssues => _allIssues;
  List<Issue> get myIssues =>
      _allIssues.where((i) => i.userId == _userId).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isSubmitting => _isSubmitting;

  // --- My reports counts ---
  int get totalReports => myIssues.length;
  int get pendingReports => myIssues.where((i) => i.isPending).length;
  int get inProgressReports => myIssues.where((i) => i.isInProgress).length;
  int get resolvedReports => myIssues.where((i) => i.isResolved).length;

  // --- Dashboard / all reports counts ---
  int get dashTotal => _allIssues.length;
  int get dashPending => _allIssues.where((i) => i.isPending).length;
  int get dashInProgress => _allIssues.where((i) => i.isInProgress).length;
  int get dashResolved => _allIssues.where((i) => i.isResolved).length;
  int get dashEscalated => _allIssues.where((i) => i.isEscalated).length;
  int get dashClosed => _allIssues.where((i) => i.isClosed).length;
  int get dashReopened => _allIssues.where((i) => i.isReopened).length;

  // Socket event callback for snackbar
  void Function(String message)? onSocketEvent;

  void _setupSocketListeners() {
    _socketService.on('newReport', (_) => fetchIssues());
    _socketService.on('statusUpdate', (data) {
      fetchIssues();
      _notifySocket('Issue status updated');
    });
    _socketService.on('issueUpdated', (_) => fetchIssues());
    _socketService.on('issueResolved', (data) {
      fetchIssues();
      _notifySocket('An issue has been resolved');
    });
    _socketService.on('issueClosed', (data) {
      fetchIssues();
      _notifySocket('An issue has been closed');
    });
    _socketService.on('issueReopened', (data) {
      fetchIssues();
      _notifySocket('An issue has been reopened');
    });
  }

  void _notifySocket(String message) {
    if (onSocketEvent != null) {
      onSocketEvent!(message);
    }
  }

  Future<void> fetchIssues() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getIssues();
      _allIssues = data.map((json) => Issue.fromJson(json)).toList();
      _allIssues.sort((a, b) =>
          (b.createdAt ?? DateTime(2000)).compareTo(a.createdAt ?? DateTime(2000)));
      _error = null;
    } on ApiException catch (e) {
      _error = e.message;
      if (e.isUnauthorized) rethrow;
    } catch (e) {
      _error = 'Failed to load issues. Check your connection.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createIssue({
    required String title,
    required String issueType,
    required String description,
    String? ward,
    double? latitude,
    double? longitude,
    File? image,
  }) async {
    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.createIssue(
        title: title,
        issueType: issueType,
        description: description,
        ward: ward,
        latitude: latitude,
        longitude: longitude,
        image: image,
      );
      _isSubmitting = false;
      notifyListeners();
      await fetchIssues();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isSubmitting = false;
      notifyListeners();
      if (e.isUnauthorized) rethrow;
      return false;
    } catch (e) {
      _error = 'Failed to submit report. Please try again.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateIssue(String issueId, Map<String, dynamic> updates) async {
    try {
      await _apiService.updateIssue(issueId, updates);
      await fetchIssues();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      if (e.isUnauthorized) rethrow;
      return false;
    } catch (e) {
      _error = 'Failed to update report.';
      notifyListeners();
      return false;
    }
  }

  /// Fetch a single issue by ID (with full statusHistory, proof, etc.)
  Future<Issue?> getIssueById(String issueId) async {
    try {
      final data = await _apiService.getIssueById(issueId);
      if (data.isNotEmpty) {
        return Issue.fromJson(data);
      }
      // Fallback: return from local cache
      final cached = _allIssues.where((i) => i.id == issueId);
      return cached.isNotEmpty ? cached.first : null;
    } catch (e) {
      // Fallback: return from local cache
      final cached = _allIssues.where((i) => i.id == issueId);
      return cached.isNotEmpty ? cached.first : null;
    }
  }

  /// Confirm a resolved issue (marks as CLOSED)
  Future<bool> confirmIssue(String issueId) async {
    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.confirmIssue(issueId);
      _isSubmitting = false;
      notifyListeners();
      await fetchIssues();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isSubmitting = false;
      notifyListeners();
      if (e.isUnauthorized) rethrow;
      return false;
    } catch (e) {
      _error = 'Failed to confirm issue. Please try again.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  /// Reopen a resolved issue with a reason
  Future<bool> reopenIssue(String issueId, String reason) async {
    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.reopenIssue(issueId, reason);
      _isSubmitting = false;
      notifyListeners();
      await fetchIssues();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isSubmitting = false;
      notifyListeners();
      if (e.isUnauthorized) rethrow;
      return false;
    } catch (e) {
      _error = 'Failed to reopen issue. Please try again.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _socketService.off('newReport');
    _socketService.off('statusUpdate');
    _socketService.off('issueUpdated');
    _socketService.off('issueResolved');
    _socketService.off('issueClosed');
    _socketService.off('issueReopened');
    super.dispose();
  }
}
