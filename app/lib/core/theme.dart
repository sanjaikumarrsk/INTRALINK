import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF0A3D62);
  static const Color accentColor = Color(0xFFF39C12);
  static const Color backgroundColor = Color(0xFFF5F6FA);
  static const Color cardColor = Colors.white;
  static const Color textPrimary = Color(0xFF2C3E50);
  static const Color textSecondary = Color(0xFF7F8C8D);
  static const Color successColor = Color(0xFF27AE60);
  static const Color warningColor = Color(0xFFF39C12);
  static const Color errorColor = Color(0xFFE74C3C);
  static const Color inProgressColor = Color(0xFF3498DB);

  static LinearGradient get primaryGradient => const LinearGradient(
        colors: [primaryColor, accentColor],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      );

  static LinearGradient get primaryGradientVertical => const LinearGradient(
        colors: [primaryColor, Color(0xFF1A5276)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      );

  static BoxDecoration get cardDecoration => BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      );

  static ButtonStyle get gradientButtonStyle => ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
        padding: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      );

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: accentColor,
        surface: cardColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
      ),
      textTheme: GoogleFonts.poppinsTextTheme().copyWith(
        headlineLarge: GoogleFonts.poppins(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.poppins(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        bodyLarge: GoogleFonts.poppins(
          fontSize: 16,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.poppins(
          fontSize: 14,
          color: textSecondary,
        ),
        bodySmall: GoogleFonts.poppins(
          fontSize: 12,
          color: textSecondary,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: cardColor,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        labelStyle: GoogleFonts.poppins(color: textSecondary),
        hintStyle: GoogleFonts.poppins(color: textSecondary.withValues(alpha: 0.6)),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accentColor,
        foregroundColor: Colors.white,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  static const Color escalatedColor = Color(0xFF8E44AD);
  static const Color closedColor = Color(0xFF2C3E50);
  static const Color reopenedColor = Color(0xFFE74C3C);

  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return warningColor;
      case 'IN_PROGRESS':
        return inProgressColor;
      case 'RESOLVED':
      case 'SOLVED':
        return successColor;
      case 'ESCALATED':
        return escalatedColor;
      case 'CLOSED':
        return closedColor;
      case 'REOPENED':
        return reopenedColor;
      case 'REJECTED':
        return errorColor;
      default:
        return textSecondary;
    }
  }

  static IconData getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Icons.hourglass_empty_rounded;
      case 'IN_PROGRESS':
        return Icons.engineering_rounded;
      case 'RESOLVED':
      case 'SOLVED':
        return Icons.check_circle_rounded;
      case 'ESCALATED':
        return Icons.priority_high_rounded;
      case 'CLOSED':
        return Icons.task_alt_rounded;
      case 'REOPENED':
        return Icons.replay_rounded;
      case 'REJECTED':
        return Icons.cancel_rounded;
      default:
        return Icons.info_rounded;
    }
  }

  static IconData getIssueTypeIcon(String type) {
    switch (type) {
      case 'Garbage Complaint':
        return Icons.delete_rounded;
      case 'Road Damage':
        return Icons.add_road_rounded;
      case 'Water Leakage':
        return Icons.water_drop_rounded;
      case 'Streetlight Not Working':
        return Icons.lightbulb_rounded;
      case 'Drainage Blockage':
        return Icons.plumbing_rounded;
      case 'Tree Fallen':
        return Icons.park_rounded;
      case 'Fire Hazard':
        return Icons.local_fire_department_rounded;
      case 'Flooding':
        return Icons.flood_rounded;
      default:
        return Icons.report_problem_rounded;
    }
  }
}
