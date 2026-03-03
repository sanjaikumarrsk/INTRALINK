import 'package:flutter/material.dart';

/// Wraps any content with the global INFRALINK background image + dark overlay.
/// Use as the `body` of a Scaffold.
class BgWrapper extends StatelessWidget {
  final Widget child;

  const BgWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Background image
        Positioned.fill(
          child: Image.asset(
            'lib/assets/bg2.jpeg',
            fit: BoxFit.cover,
          ),
        ),
        // Dark overlay for readability
        Positioned.fill(
          child: Container(
            color: Colors.black.withValues(alpha: 0.6),
          ),
        ),
        // Actual page content
        Positioned.fill(child: child),
      ],
    );
  }
}
