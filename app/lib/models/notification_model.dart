class AppNotification {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime? createdAt;
  final String? issueId;

  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    this.isRead = false,
    this.createdAt,
    this.issueId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] ?? '',
      title: json['title'] ?? json['type'] ?? 'Notification',
      message: json['message'] ?? json['text'] ?? '',
      type: json['type'] ?? 'general',
      isRead: json['isRead'] ?? json['read'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      issueId: json['issueId'],
    );
  }
}
