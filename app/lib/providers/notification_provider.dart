import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class NotificationProvider with ChangeNotifier {
  final ApiService _apiService;
  final SocketService _socketService;

  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  String? _error;

  NotificationProvider(this._apiService, this._socketService) {
    _setupSocketListeners();
  }

  List<AppNotification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  void _setupSocketListeners() {
    _socketService.on('notification', (data) {
      fetchNotifications();
    });
    _socketService.on('broadcastNotification', (data) {
      fetchNotifications();
    });
    _socketService.on('statusUpdate', (data) {
      fetchNotifications();
    });
    _socketService.on('zoneUpdate', (data) {
      fetchNotifications();
    });
  }

  Future<void> fetchNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getNotifications();
      _notifications = data.map((json) => AppNotification.fromJson(json)).toList();
      _notifications.sort((a, b) =>
          (b.createdAt ?? DateTime(2000)).compareTo(a.createdAt ?? DateTime(2000)));
      _error = null;
    } on ApiException catch (e) {
      _error = e.message;
      if (e.isUnauthorized) rethrow;
    } catch (e) {
      _error = 'Failed to load notifications.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await _apiService.markNotificationRead(notificationId);
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        final old = _notifications[index];
        _notifications[index] = AppNotification(
          id: old.id,
          title: old.title,
          message: old.message,
          type: old.type,
          isRead: true,
          createdAt: old.createdAt,
          issueId: old.issueId,
        );
        notifyListeners();
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _socketService.off('notification');
    _socketService.off('broadcastNotification');
    _socketService.off('statusUpdate');
    _socketService.off('zoneUpdate');
    super.dispose();
  }
}
