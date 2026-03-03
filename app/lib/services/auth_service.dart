import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants.dart';
import '../models/user_model.dart';

class AuthService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Future<void> saveUser(User user) async {
    await _storage.write(key: AppConstants.userKey, value: jsonEncode(user.toJson()));
  }

  Future<User?> getUser() async {
    final data = await _storage.read(key: AppConstants.userKey);
    if (data != null) {
      return User.fromJson(jsonDecode(data));
    }
    return null;
  }

  Future<void> saveRole(String role) async {
    await _storage.write(key: AppConstants.roleKey, value: role);
  }

  Future<String?> getRole() async {
    return await _storage.read(key: AppConstants.roleKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    final role = await getRole();
    return token != null && token.isNotEmpty && role == 'USER';
  }
}
