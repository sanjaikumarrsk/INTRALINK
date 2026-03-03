import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import '../core/constants.dart';

class ApiService {
  String? _token;
  final Duration _timeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  // ── Debug logger ──────────────────────────────────────────────
  void _log(String tag, String message) {
    debugPrint('[INFRALINK API][$tag] $message');
  }

  void _logResponse(String tag, http.Response response) {
    _log(tag, 'STATUS: ${response.statusCode}');
    _log(tag, 'BODY: ${response.body.length > 500 ? response.body.substring(0, 500) : response.body}');
  }

  // ── Friendly error from exceptions ────────────────────────────
  String _friendlyError(Object e) {
    if (e is SocketException) {
      return 'Cannot connect to server. Check WiFi connection.';
    } else if (e is TimeoutException) {
      return 'Server not responding. Check if backend is running.';
    } else if (e is ApiException) {
      return e.message;
    }
    return 'Something went wrong. Please try again.';
  }

  // ── LOGIN ─────────────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String mobileNumber, String password) async {
    const tag = 'LOGIN';
    _log(tag, 'Attempting login for $mobileNumber → ${AppConstants.loginEndpoint}');

    try {
      final response = await http.post(
        Uri.parse(AppConstants.loginEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mobileNumber': mobileNumber,
          'password': password,
        }),
      ).timeout(_timeout);

      _logResponse(tag, response);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data;
      } else {
        throw ApiException(
          data['message'] ?? data['error'] ?? 'Login failed',
          response.statusCode,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── SIGNUP ────────────────────────────────────────────────────
  Future<Map<String, dynamic>> signup({
    required String name,
    required String mobileNumber,
    required String password,
    String? ward,
  }) async {
    const tag = 'SIGNUP';
    _log(tag, 'Attempting signup for $mobileNumber → ${AppConstants.signupEndpoint}');

    try {
      final body = <String, dynamic>{
        'name': name,
        'mobileNumber': mobileNumber,
        'password': password,
        'role': 'USER',
      };
      if (ward != null && ward.isNotEmpty) body['ward'] = ward;

      final response = await http.post(
        Uri.parse(AppConstants.signupEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(_timeout);

      _logResponse(tag, response);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data;
      } else {
        throw ApiException(
          data['message'] ?? data['error'] ?? 'Signup failed',
          response.statusCode,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── GET ISSUES ────────────────────────────────────────────────
  Future<List<dynamic>> getIssues() async {
    const tag = 'GET_ISSUES';
    _log(tag, 'Fetching issues → ${AppConstants.issuesEndpoint}');

    try {
      final response = await http.get(
        Uri.parse(AppConstants.issuesEndpoint),
        headers: _headers,
      ).timeout(_timeout);

      _logResponse(tag, response);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
        if (data is Map && data.containsKey('issues')) return data['issues'];
        if (data is Map && data.containsKey('data')) return data['data'];
        return [];
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException('Failed to fetch issues', response.statusCode);
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── CREATE ISSUE ──────────────────────────────────────────────
  Future<Map<String, dynamic>> createIssue({
    required String title,
    required String issueType,
    required String description,
    String? ward,
    double? latitude,
    double? longitude,
    File? image,
  }) async {
    const tag = 'CREATE_ISSUE';
    _log(tag, 'Creating issue: $issueType');

    try {
      final uri = Uri.parse(AppConstants.issuesEndpoint);
      final request = http.MultipartRequest('POST', uri);

      request.headers['Authorization'] = 'Bearer $_token';

      request.fields['title'] = title;
      request.fields['issueType'] = issueType;
      request.fields['description'] = description;
      if (ward != null && ward.isNotEmpty) request.fields['ward'] = ward;
      if (latitude != null) request.fields['latitude'] = latitude.toString();
      if (longitude != null) request.fields['longitude'] = longitude.toString();

      if (image != null) {
        final mimeType = lookupMimeType(image.path) ?? 'image/jpeg';
        final parts = mimeType.split('/');
        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            image.path,
            contentType: MediaType(parts[0], parts[1]),
          ),
        );
      }

      final streamedResponse = await request.send().timeout(_timeout);
      final response = await http.Response.fromStream(streamedResponse);

      _logResponse(tag, response);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data;
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException(
          data['message'] ?? 'Failed to create issue',
          response.statusCode,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── UPDATE ISSUE ──────────────────────────────────────────────
  Future<Map<String, dynamic>> updateIssue(String issueId, Map<String, dynamic> updates) async {
    const tag = 'UPDATE_ISSUE';
    _log(tag, 'Updating issue $issueId');

    try {
      final response = await http.put(
        Uri.parse('${AppConstants.issuesEndpoint}/$issueId'),
        headers: _headers,
        body: jsonEncode(updates),
      ).timeout(_timeout);

      _logResponse(tag, response);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException(
          data['message'] ?? 'Failed to update issue',
          response.statusCode,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── CONFIRM ISSUE ─────────────────────────────────────────────
  Future<Map<String, dynamic>> confirmIssue(String issueId) async {
    const tag = 'CONFIRM_ISSUE';
    _log(tag, 'Confirming issue $issueId');

    try {
      final response = await http.post(
        Uri.parse('${AppConstants.issuesEndpoint}/$issueId/confirm'),
        headers: _headers,
      ).timeout(_timeout);

      _logResponse(tag, response);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data;
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException(
          data['message'] ?? 'Failed to confirm issue',
          response.statusCode,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── REOPEN ISSUE ──────────────────────────────────────────────
  Future<Map<String, dynamic>> reopenIssue(
      String issueId, String reason) async {
    const tag = 'REOPEN_ISSUE';
    _log(tag, 'Reopening issue $issueId');

    try {
      final response = await http.post(
        Uri.parse('${AppConstants.issuesEndpoint}/$issueId/reopen'),
        headers: _headers,
        body: jsonEncode({'reason': reason}),
      ).timeout(_timeout);

      _logResponse(tag, response);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data;
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException(
          data['message'] ?? 'Failed to reopen issue',
          response.statusCode,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── GET SINGLE ISSUE ──────────────────────────────────────────
  Future<Map<String, dynamic>> getIssueById(String issueId) async {
    const tag = 'GET_ISSUE';
    _log(tag, 'Fetching issue $issueId');

    try {
      final response = await http.get(
        Uri.parse('${AppConstants.issuesEndpoint}/$issueId'),
        headers: _headers,
      ).timeout(_timeout);

      _logResponse(tag, response);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          // Some backends wrap in { issue: {...} }
          if (data.containsKey('issue') && data['issue'] is Map) {
            return Map<String, dynamic>.from(data['issue']);
          }
          return data;
        }
        return {};
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException('Failed to fetch issue details', response.statusCode);
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── GET NOTIFICATIONS ─────────────────────────────────────────
  Future<List<dynamic>> getNotifications() async {
    const tag = 'GET_NOTIFS';
    _log(tag, 'Fetching notifications');

    try {
      final response = await http.get(
        Uri.parse(AppConstants.notificationsEndpoint),
        headers: _headers,
      ).timeout(_timeout);

      _logResponse(tag, response);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
        if (data is Map && data.containsKey('notifications')) return data['notifications'];
        if (data is Map && data.containsKey('data')) return data['data'];
        return [];
      } else if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      } else {
        throw ApiException('Failed to fetch notifications', response.statusCode);
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      _log(tag, 'ERROR: $e');
      throw ApiException(_friendlyError(e), 0);
    }
  }

  // ── MARK NOTIFICATION READ ────────────────────────────────────
  Future<void> markNotificationRead(String notificationId) async {
    const tag = 'MARK_READ';
    try {
      final response = await http.put(
        Uri.parse('${AppConstants.notificationsEndpoint}/$notificationId/read'),
        headers: _headers,
      ).timeout(_timeout);

      _logResponse(tag, response);

      if (response.statusCode == 401) {
        throw ApiException('Unauthorized', 401);
      }
    } catch (e) {
      _log(tag, 'ERROR: $e');
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}
