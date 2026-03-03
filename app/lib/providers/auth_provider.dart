import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();

  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isLoggedIn = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _isLoggedIn;
  ApiService get apiService => _apiService;
  SocketService get socketService => _socketService;

  Future<bool> checkAuth() async {
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        final token = await _authService.getToken();
        final user = await _authService.getUser();
        if (token != null && user != null && user.role == 'USER') {
          _user = user;
          _isLoggedIn = true;
          _apiService.setToken(token);
          _socketService.connect(token);
          notifyListeners();
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('[AUTH] checkAuth error: $e');
      return false;
    }
  }

  // ── LOGIN with try-catch-finally ──────────────────────────────
  Future<bool> login(String mobileNumber, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(mobileNumber, password);

      final token = response['token'] ?? '';
      final role = response['role'] ?? '';

      if (role != 'USER') {
        _error = 'Only USER role can access this app';
        return false;
      }

      final user = User.fromJson(response, token: token);

      await _authService.saveToken(token);
      await _authService.saveUser(user);
      await _authService.saveRole(role);

      _user = user;
      _isLoggedIn = true;
      _apiService.setToken(token);
      _socketService.connect(token);

      return true;
    } on ApiException catch (e) {
      _error = e.message;
      debugPrint('[AUTH] Login ApiException: ${e.message}');
      return false;
    } catch (e) {
      _error = 'Cannot connect to server. Check WiFi connection.';
      debugPrint('[AUTH] Login error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── SIGNUP with try-catch-finally ─────────────────────────────
  Future<bool> signup({
    required String name,
    required String mobileNumber,
    required String password,
    String? ward,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.signup(
        name: name,
        mobileNumber: mobileNumber,
        password: password,
        ward: ward,
      );

      final token = response['token'] ?? '';
      final role = response['role'] ?? 'USER';

      if (token.isEmpty) {
        // Signup succeeded but no auto-login token → user must login
        return true;
      }

      final user = User.fromJson(response, token: token);

      await _authService.saveToken(token);
      await _authService.saveUser(user);
      await _authService.saveRole(role);

      _user = user;
      _isLoggedIn = true;
      _apiService.setToken(token);
      _socketService.connect(token);

      return true;
    } on ApiException catch (e) {
      _error = e.message;
      debugPrint('[AUTH] Signup ApiException: ${e.message}');
      return false;
    } catch (e) {
      _error = 'Cannot connect to server. Check WiFi connection.';
      debugPrint('[AUTH] Signup error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _socketService.disconnect();
    _apiService.clearToken();
    await _authService.clearAll();
    _user = null;
    _isLoggedIn = false;
    _error = null;
    notifyListeners();
  }

  void handleUnauthorized() {
    logout();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
