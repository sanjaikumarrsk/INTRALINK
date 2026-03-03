import '../config/api_config.dart';

class AppConstants {
  static const String appName = 'INFRALINK';

  // ============================================================
  // API CONFIGURATION — pulled from lib/config/api_config.dart
  // When IP changes, edit ONLY api_config.dart. Nothing else.
  // ============================================================
  static const String serverIp = ApiConfig.serverIp;
  static const int serverPort = ApiConfig.serverPort;
  static const String baseUrl = ApiConfig.baseUrl;
  static const String apiUrl = '$baseUrl/api';
  static const String socketUrl = baseUrl;
  static const String uploadsUrl = '$baseUrl/uploads';

  // HTTP timeout in seconds
  static const int requestTimeoutSeconds = 15;

  // API Endpoints
  static const String loginEndpoint = '$apiUrl/auth/login';
  static const String signupEndpoint = '$apiUrl/auth/register';
  static const String issuesEndpoint = '$apiUrl/issues';
  static const String notificationsEndpoint = '$apiUrl/notifications';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String roleKey = 'user_role';

  // Issue Types
  static const List<String> issueTypes = [
    'Garbage Complaint',
    'Road Damage',
    'Water Leakage',
    'Streetlight Not Working',
    'Drainage Blockage',
    'Tree Fallen',
    'Fire Hazard',
    'Flooding',
  ];

  // Status Labels
  static const Map<String, String> statusLabels = {
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'RESOLVED': 'Solved',
    'SOLVED': 'Solved',
    'ESCALATED': 'Escalated',
    'CLOSED': 'Closed',
    'REOPENED': 'Reopened',
    'REJECTED': 'Rejected',
  };
}
