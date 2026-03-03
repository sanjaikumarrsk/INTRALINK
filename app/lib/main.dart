import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/issue_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const InfralinkApp());
}

class InfralinkApp extends StatelessWidget {
  const InfralinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MultiProvider(
            providers: [
              ChangeNotifierProvider<IssueProvider>(
                create: (_) => IssueProvider(
                  authProvider.apiService,
                  authProvider.socketService,
                  authProvider.user?.id,
                ),
              ),
              ChangeNotifierProvider<NotificationProvider>(
                create: (_) => NotificationProvider(
                  authProvider.apiService,
                  authProvider.socketService,
                ),
              ),
            ],
            child: MaterialApp(
              title: 'INFRALINK',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              home: const SplashScreen(),
            ),
          );
        },
      ),
    );
  }
}
