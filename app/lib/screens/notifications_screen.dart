import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/notification_provider.dart';
import '../widgets/common_widgets.dart';
import '../widgets/bg_wrapper.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              Provider.of<NotificationProvider>(context, listen: false)
                  .fetchNotifications();
            },
          ),
        ],
      ),
      body: BgWrapper(
        child: Consumer<NotificationProvider>(
          builder: (context, notifProvider, _) {
            if (notifProvider.isLoading && notifProvider.notifications.isEmpty) {
              return const LoadingWidget(message: 'Loading notifications...');
            }

            if (notifProvider.notifications.isEmpty) {
              return const EmptyWidget(
                icon: Icons.notifications_none_rounded,
                title: 'No Notifications',
                subtitle: 'You\'ll be notified about status updates and alerts',
              );
            }

            return RefreshIndicator(
              onRefresh: () => notifProvider.fetchNotifications(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notifProvider.notifications.length,
              itemBuilder: (context, index) {
                final notification = notifProvider.notifications[index];
                return GestureDetector(
                  onTap: () {
                    if (!notification.isRead) {
                      notifProvider.markAsRead(notification.id);
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: notification.isRead
                          ? Colors.white
                          : AppTheme.primaryColor.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: notification.isRead
                            ? Colors.grey.shade200
                            : AppTheme.primaryColor.withValues(alpha: 0.2),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _getTypeColor(notification.type)
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            _getTypeIcon(notification.type),
                            color: _getTypeColor(notification.type),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      notification.title,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: notification.isRead
                                                ? FontWeight.w500
                                                : FontWeight.w700,
                                          ),
                                    ),
                                  ),
                                  if (!notification.isRead)
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppTheme.accentColor,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notification.message,
                                style: Theme.of(context).textTheme.bodyMedium,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (notification.createdAt != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  DateFormat('MMM dd, yyyy – hh:mm a')
                                      .format(notification.createdAt!),
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(fontSize: 11),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(
                          delay: Duration(milliseconds: index * 60),
                          duration: 350.ms)
                      .slideX(begin: 0.05, end: 0),
                );
              },
            ),
          );
        },
        ),
      ),
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'status_update':
      case 'statusupdate':
        return Icons.update_rounded;
      case 'broadcast':
      case 'broadcastnotification':
        return Icons.campaign_rounded;
      case 'zone_update':
      case 'zoneupdate':
        return Icons.map_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'status_update':
      case 'statusupdate':
        return AppTheme.inProgressColor;
      case 'broadcast':
      case 'broadcastnotification':
        return AppTheme.accentColor;
      case 'zone_update':
      case 'zoneupdate':
        return AppTheme.successColor;
      default:
        return AppTheme.primaryColor;
    }
  }
}
