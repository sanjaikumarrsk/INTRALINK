import '../core/constants.dart';

class StatusHistoryEntry {
  final String status;
  final String? changedBy;
  final String? changedByRole;
  final String? note;
  final String? proofImage;
  final DateTime? timestamp;

  StatusHistoryEntry({
    required this.status,
    this.changedBy,
    this.changedByRole,
    this.note,
    this.proofImage,
    this.timestamp,
  });

  factory StatusHistoryEntry.fromJson(Map<String, dynamic> json) {
    final changedBy = json['changedBy'] ?? json['updatedBy'];
    String? name;
    String? role;
    if (changedBy is Map) {
      name = changedBy['name']?.toString();
      role = changedBy['role']?.toString();
    } else if (changedBy is String) {
      name = changedBy;
    }

    return StatusHistoryEntry(
      status: json['status'] ?? '',
      changedBy: name ?? json['changedByName']?.toString(),
      changedByRole: role ?? json['role']?.toString(),
      note: json['note']?.toString() ??
          json['remarks']?.toString() ??
          json['comment']?.toString(),
      proofImage: json['proofImage']?.toString() ??
          json['afterImage']?.toString() ??
          json['image']?.toString(),
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString())
          : json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString())
              : json['date'] != null
                  ? DateTime.tryParse(json['date'].toString())
                  : null,
    );
  }

  String get proofImageUrl {
    if (proofImage == null || proofImage!.isEmpty) return '';
    if (proofImage!.startsWith('http')) return proofImage!;
    return '${AppConstants.uploadsUrl}/$proofImage';
  }
}

class Issue {
  final String id;
  final String? title;
  final String issueType;
  final String description;
  final String status;
  final String? image;
  final String? afterImage;
  final String? resolutionNote;
  final String? resolvedBy;
  final DateTime? resolvedAt;
  final String? ward;
  final double? latitude;
  final double? longitude;
  final String? userId;
  final String? userName;
  final String? userMobile;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<StatusHistoryEntry> statusHistory;

  Issue({
    required this.id,
    this.title,
    required this.issueType,
    required this.description,
    required this.status,
    this.image,
    this.afterImage,
    this.resolutionNote,
    this.resolvedBy,
    this.resolvedAt,
    this.ward,
    this.latitude,
    this.longitude,
    this.userId,
    this.userName,
    this.userMobile,
    this.createdAt,
    this.updatedAt,
    this.statusHistory = const [],
  });

  factory Issue.fromJson(Map<String, dynamic> json) {
    // Backend populates reportedBy as an object; fallback to userId field
    final reporter = json['reportedBy'] ?? json['userId'];
    String? parsedUserId;
    String? parsedUserName;
    String? parsedUserMobile;

    if (reporter is Map) {
      parsedUserId = reporter['_id']?.toString();
      parsedUserName = reporter['name']?.toString();
      parsedUserMobile = reporter['mobileNumber']?.toString();
    } else if (reporter is String) {
      parsedUserId = reporter;
    }

    // Parse resolved by
    final resolvedByData = json['resolvedBy'];
    String? resolvedByName;
    if (resolvedByData is Map) {
      resolvedByName = resolvedByData['name']?.toString();
    } else if (resolvedByData is String) {
      resolvedByName = resolvedByData;
    }

    // Parse status history
    List<StatusHistoryEntry> history = [];
    if (json['statusHistory'] is List) {
      history = (json['statusHistory'] as List)
          .map((e) =>
              StatusHistoryEntry.fromJson(e is Map<String, dynamic> ? e : {}))
          .toList();
    }

    return Issue(
      id: json['_id'] ?? '',
      title: json['title']?.toString(),
      issueType: json['issueType'] ?? json['category'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'pending',
      image: json['image'],
      afterImage:
          json['afterImage']?.toString() ?? json['proofImage']?.toString(),
      resolutionNote: json['resolutionNote']?.toString() ??
          json['resolvedNote']?.toString() ??
          json['remarks']?.toString(),
      resolvedBy: resolvedByName,
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.tryParse(json['resolvedAt'].toString())
          : null,
      ward: json['ward']?.toString(),
      latitude:
          (json['latitude'] ?? json['location']?['latitude'])?.toDouble(),
      longitude:
          (json['longitude'] ?? json['location']?['longitude'])?.toDouble(),
      userId: parsedUserId,
      userName: parsedUserName ?? json['userName'],
      userMobile: parsedUserMobile ?? json['userMobile'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
      statusHistory: history,
    );
  }

  String get imageUrl {
    if (image == null || image!.isEmpty) return '';
    if (image!.startsWith('http')) return image!;
    return '${AppConstants.uploadsUrl}/$image';
  }

  String get afterImageUrl {
    if (afterImage == null || afterImage!.isEmpty) return '';
    if (afterImage!.startsWith('http')) return afterImage!;
    return '${AppConstants.uploadsUrl}/$afterImage';
  }

  String get statusLabel =>
      AppConstants.statusLabels[status.toUpperCase()] ?? status;

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isInProgress =>
      status.toUpperCase() == 'IN_PROGRESS' ||
      status.toUpperCase() == 'IN PROGRESS';
  bool get isResolved =>
      status.toUpperCase() == 'RESOLVED' || status.toUpperCase() == 'SOLVED';
  bool get isEscalated => status.toUpperCase() == 'ESCALATED';
  bool get isClosed => status.toUpperCase() == 'CLOSED';
  bool get isReopened => status.toUpperCase() == 'REOPENED';

  /// User can confirm only when issue is SOLVED/RESOLVED
  bool get canConfirm => isResolved;

  /// User can reopen only when issue is SOLVED/RESOLVED
  bool get canReopen => isResolved;
}
