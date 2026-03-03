import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/constants.dart';

typedef SocketEventCallback = void Function(dynamic data);

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;
  final Map<String, List<SocketEventCallback>> _listeners = {};

  bool get isConnected => _isConnected;

  void connect(String token) {
    // Disconnect existing socket before reconnecting
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
    }

    debugPrint('[INFRALINK SOCKET] Connecting to ${AppConstants.socketUrl}');

    _socket = io.io(
      AppConstants.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionAttempts(10)
          .setAuth({'token': token})
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('[INFRALINK SOCKET] Connected ✓');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('[INFRALINK SOCKET] Disconnected');
    });

    _socket!.onConnectError((error) {
      _isConnected = false;
      debugPrint('[INFRALINK SOCKET] Connection error: $error');
    });

    _socket!.onError((error) {
      _isConnected = false;
      debugPrint('[INFRALINK SOCKET] Error: $error');
    });

    // Listen for the required events
    _setupEventListeners();
  }

  void _setupEventListeners() {
    final events = [
      'newReport',
      'statusUpdate',
      'issueUpdated',
      'issueResolved',
      'issueClosed',
      'issueReopened',
      'notification',
      'zoneUpdate',
      'broadcastNotification',
    ];

    for (final event in events) {
      _socket!.on(event, (data) {
        _notifyListeners(event, data);
      });
    }
  }

  void _notifyListeners(String event, dynamic data) {
    if (_listeners.containsKey(event)) {
      for (final callback in _listeners[event]!) {
        callback(data);
      }
    }
  }

  void on(String event, SocketEventCallback callback) {
    _listeners[event] ??= [];
    _listeners[event]!.add(callback);
  }

  void off(String event, [SocketEventCallback? callback]) {
    if (callback != null) {
      _listeners[event]?.remove(callback);
    } else {
      _listeners.remove(event);
    }
  }

  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }

  void disconnect() {
    _listeners.clear();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }
}
