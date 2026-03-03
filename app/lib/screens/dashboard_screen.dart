import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/issue_provider.dart';
import '../providers/notification_provider.dart';
import '../widgets/status_card.dart';
import '../widgets/common_widgets.dart';
import '../widgets/bg_wrapper.dart';
import 'create_report_screen.dart';
import 'my_reports_screen.dart';
import 'all_reports_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
      _setupSocketSnackbar();
    });
  }

  void _loadData() {
    try {
      final issueProvider = Provider.of<IssueProvider>(context, listen: false);
      final notifProvider =
          Provider.of<NotificationProvider>(context, listen: false);
      issueProvider.fetchIssues();
      notifProvider.fetchNotifications();
    } catch (_) {}
  }

  void _setupSocketSnackbar() {
    try {
      final issueProvider = Provider.of<IssueProvider>(context, listen: false);
      issueProvider.onSocketEvent = (message) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.notifications_active_rounded,
                      color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(message)),
                ],
              ),
              backgroundColor: AppTheme.primaryColor,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              duration: const Duration(seconds: 3),
            ),
          );
        }
      };
    } catch (_) {}
  }

  void _onTabTapped(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  void dispose() {
    try {
      final issueProvider = Provider.of<IssueProvider>(context, listen: false);
      issueProvider.onSocketEvent = null;
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      const _DashboardHome(),
      const MyReportsScreen(),
      const AllReportsScreen(),
      const NotificationsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const CreateReportScreen()),
                );
                // Refresh dashboard after report creation
                if (result == true) _loadData();
              },
              icon: const Icon(Icons.add_rounded),
              label: const Text('New Report'),
              backgroundColor: AppTheme.accentColor,
            ).animate().fadeIn(delay: 500.ms).slideY(begin: 1, end: 0)
          : null,
      bottomNavigationBar: Consumer<NotificationProvider>(
        builder: (context, notifProvider, _) {
          return NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: _onTabTapped,
            backgroundColor: Colors.white,
            elevation: 8,
            indicatorColor: AppTheme.primaryColor.withValues(alpha: 0.12),
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.dashboard_rounded),
                selectedIcon:
                    Icon(Icons.dashboard_rounded, color: AppTheme.primaryColor),
                label: 'Dashboard',
              ),
              const NavigationDestination(
                icon: Icon(Icons.description_rounded),
                selectedIcon: Icon(Icons.description_rounded,
                    color: AppTheme.primaryColor),
                label: 'My Reports',
              ),
              const NavigationDestination(
                icon: Icon(Icons.list_alt_rounded),
                selectedIcon:
                    Icon(Icons.list_alt_rounded, color: AppTheme.primaryColor),
                label: 'All Reports',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: notifProvider.unreadCount > 0,
                  label: Text('${notifProvider.unreadCount}'),
                  child: const Icon(Icons.notifications_rounded),
                ),
                selectedIcon: Badge(
                  isLabelVisible: notifProvider.unreadCount > 0,
                  label: Text('${notifProvider.unreadCount}'),
                  child: const Icon(Icons.notifications_rounded,
                      color: AppTheme.primaryColor),
                ),
                label: 'Alerts',
              ),
              const NavigationDestination(
                icon: Icon(Icons.person_rounded),
                selectedIcon:
                    Icon(Icons.person_rounded, color: AppTheme.primaryColor),
                label: 'Profile',
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Dashboard Home Tab
// ─────────────────────────────────────────────────────────────────
class _DashboardHome extends StatelessWidget {
  const _DashboardHome();

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.asset('lib/assets/logo.jpeg',
                  height: 32, width: 32, fit: BoxFit.cover),
            ),
            const SizedBox(width: 10),
            const Text('INFRALINK'),
          ],
        ),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              Provider.of<IssueProvider>(context, listen: false).fetchIssues();
              Provider.of<NotificationProvider>(context, listen: false)
                  .fetchNotifications();
            },
          ),
        ],
      ),
      body: BgWrapper(
        child: Consumer<IssueProvider>(
          builder: (context, issueProvider, _) {
            if (issueProvider.isLoading && issueProvider.allIssues.isEmpty) {
              return const LoadingWidget(message: 'Loading dashboard...');
            }

            return RefreshIndicator(
              onRefresh: () => issueProvider.fetchIssues(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Header with logo ──
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color:
                                AppTheme.primaryColor.withValues(alpha: 0.35),
                            blurRadius: 14,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.asset('lib/assets/logo.jpeg',
                                height: 56, width: 56, fit: BoxFit.cover),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hello, ${user?.name ?? 'Citizen'} 👋',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Monitor your infrastructure reports',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color:
                                        Colors.white.withValues(alpha: 0.85),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 500.ms)
                        .slideY(begin: -0.1, end: 0),

                    const SizedBox(height: 24),

                    // ── Stats Grid (uses ALL issues from API) ──
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.4,
                      children: [
                        StatusCard(
                          title: 'Total Reports',
                          count: issueProvider.dashTotal,
                          icon: Icons.assignment_rounded,
                          color: AppTheme.primaryColor,
                          delay: 0,
                        ),
                        StatusCard(
                          title: 'Pending',
                          count: issueProvider.dashPending,
                          icon: Icons.hourglass_empty_rounded,
                          color: AppTheme.warningColor,
                          delay: 100,
                        ),
                        StatusCard(
                          title: 'In Progress',
                          count: issueProvider.dashInProgress,
                          icon: Icons.engineering_rounded,
                          color: AppTheme.inProgressColor,
                          delay: 200,
                        ),
                        StatusCard(
                          title: 'Resolved',
                          count: issueProvider.dashResolved,
                          icon: Icons.check_circle_rounded,
                          color: AppTheme.successColor,
                          delay: 300,
                        ),
                        if (issueProvider.dashClosed > 0)
                          StatusCard(
                            title: 'Closed',
                            count: issueProvider.dashClosed,
                            icon: Icons.task_alt_rounded,
                            color: AppTheme.closedColor,
                            delay: 350,
                          ),
                        if (issueProvider.dashReopened > 0)
                          StatusCard(
                            title: 'Reopened',
                            count: issueProvider.dashReopened,
                            icon: Icons.replay_rounded,
                            color: AppTheme.reopenedColor,
                            delay: 375,
                          ),
                      ],
                    ),

                    if (issueProvider.dashEscalated > 0) ...[
                      const SizedBox(height: 12),
                      StatusCard(
                        title: 'Escalated',
                        count: issueProvider.dashEscalated,
                        icon: Icons.warning_amber_rounded,
                        color: AppTheme.errorColor,
                        delay: 400,
                      ),
                    ],

                    const SizedBox(height: 28),
                    Text(
                      'Quick Actions',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(color: Colors.white),
                    ).animate().fadeIn(delay: 400.ms),
                    const SizedBox(height: 12),
                    _QuickActionCard(
                      icon: Icons.add_circle_rounded,
                      title: 'Submit New Report',
                      subtitle: 'Report an infrastructure issue',
                      color: AppTheme.accentColor,
                      onTap: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const CreateReportScreen()),
                        );
                        if (result == true) {
                          issueProvider.fetchIssues();
                        }
                      },
                    )
                        .animate()
                        .fadeIn(delay: 500.ms)
                        .slideX(begin: 0.1, end: 0),
                    const SizedBox(height: 8),
                    _QuickActionCard(
                      icon: Icons.track_changes_rounded,
                      title: 'Track My Reports',
                      subtitle: 'View status of your submissions',
                      color: AppTheme.primaryColor,
                      onTap: () {
                        final dashState = context
                            .findAncestorStateOfType<_DashboardScreenState>();
                        dashState?._onTabTapped(1);
                      },
                    )
                        .animate()
                        .fadeIn(delay: 600.ms)
                        .slideX(begin: 0.1, end: 0),

                    if (issueProvider.error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.errorColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded,
                                color: Colors.white),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                issueProvider.error!,
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Quick Action Card
// ─────────────────────────────────────────────────────────────────
class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios_rounded,
                  size: 16, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
