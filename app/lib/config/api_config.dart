// ============================================================
// INFRALINK – CENTRAL API CONFIGURATION
// ============================================================
//
// IMPORTANT:
// When laptop IP changes, update ONLY this file.
// Do NOT edit anywhere else.
//
// Steps:
//   1. Run `ipconfig` on your laptop
//   2. Copy the IPv4 address
//   3. Replace the IP below
//   4. Hot-restart the app
// ============================================================

class ApiConfig {
  /// Current laptop/server IP address
  static const String serverIp = '10.207.250.84';

  /// Server port (default: 5000)
  static const int serverPort = 5000;

  /// Base URL – built automatically from IP + port
  static const String baseUrl = 'http://$serverIp:$serverPort';
}
