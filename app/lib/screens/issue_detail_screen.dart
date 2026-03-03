import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../models/issue_model.dart';
import '../providers/issue_provider.dart';
import '../widgets/bg_wrapper.dart';

class IssueDetailScreen extends StatefulWidget {
  final Issue issue;
  final bool isOwner;

  const IssueDetailScreen({
    super.key,
    required this.issue,
    this.isOwner = false,
  });

  @override
  State<IssueDetailScreen> createState() => _IssueDetailScreenState();
}

class _IssueDetailScreenState extends State<IssueDetailScreen> {
  late Issue _issue;
  bool _isLoadingDetail = true;
  bool _isConfirming = false;
  bool _isReopening = false;

  @override
  void initState() {
    super.initState();
    _issue = widget.issue;
    _fetchFullDetail();
  }

  Future<void> _fetchFullDetail() async {
    try {
      final provider = Provider.of<IssueProvider>(context, listen: false);
      final detail = await provider.getIssueById(widget.issue.id);
      if (detail != null && mounted) {
        setState(() {
          _issue = detail;
          _isLoadingDetail = false;
        });
      } else {
        if (mounted) setState(() => _isLoadingDetail = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingDetail = false);
    }
  }

  Future<void> _confirmIssue() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.task_alt_rounded, color: AppTheme.successColor),
            const SizedBox(width: 8),
            const Text('Confirm Completion'),
          ],
        ),
        content: const Text(
          'Are you satisfied with the resolution? This will close the issue.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Yes, Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isConfirming = true);
    final provider = Provider.of<IssueProvider>(context, listen: false);
    final success = await provider.confirmIssue(_issue.id);
    if (mounted) {
      setState(() => _isConfirming = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Issue confirmed and closed successfully!'),
              ],
            ),
            backgroundColor: AppTheme.successColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
        await _fetchFullDetail();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Failed to confirm issue'),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _reopenIssue() async {
    final reasonController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.replay_rounded, color: AppTheme.reopenedColor),
            const SizedBox(width: 8),
            const Text('Reopen Issue'),
          ],
        ),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Please provide a reason for reopening this issue:',
                style:
                    TextStyle(fontSize: 14, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: reasonController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Reason for reopening...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Reason is required'
                    : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.reopenedColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              if (formKey.currentState!.validate()) {
                Navigator.pop(ctx, reasonController.text.trim());
              }
            },
            child: const Text('Reopen'),
          ),
        ],
      ),
    );

    if (reason == null || reason.isEmpty || !mounted) return;

    setState(() => _isReopening = true);
    final provider = Provider.of<IssueProvider>(context, listen: false);
    final success = await provider.reopenIssue(_issue.id, reason);
    if (mounted) {
      setState(() => _isReopening = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.replay_rounded, color: Colors.white),
                SizedBox(width: 8),
                Text('Issue reopened successfully!'),
              ],
            ),
            backgroundColor: AppTheme.reopenedColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
        await _fetchFullDetail();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Failed to reopen issue'),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoadingDetail = true);
              _fetchFullDetail();
            },
          ),
        ],
      ),
      body: BgWrapper(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Before image
              if (_issue.imageUrl.isNotEmpty)
                Stack(
                  children: [
                    CachedNetworkImage(
                      imageUrl: _issue.imageUrl,
                      height: 250,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        height: 250,
                        color: Colors.grey.shade200,
                        child: const Center(
                            child: CircularProgressIndicator()),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        height: 250,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.broken_image,
                            size: 64, color: Colors.grey),
                      ),
                    ),
                    Positioned(
                      bottom: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Before',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status Banner
                    _buildStatusBanner()
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: -0.1, end: 0),
                    const SizedBox(height: 20),

                    // Title
                    if (_issue.title != null &&
                        _issue.title!.isNotEmpty) ...[
                      Text(
                        _issue.title!,
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.white),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Details card
                    _buildDetailsCard()
                        .animate()
                        .fadeIn(delay: 200.ms, duration: 400.ms),
                    const SizedBox(height: 16),

                    // Proof / After Image section (when SOLVED)
                    if (_issue.isResolved || _issue.isClosed)
                      _buildProofSection()
                          .animate()
                          .fadeIn(delay: 300.ms, duration: 400.ms),

                    // Status Timeline
                    if (_issue.statusHistory.isNotEmpty ||
                        !_isLoadingDetail) ...[
                      const SizedBox(height: 20),
                      _buildTimelineSection()
                          .animate()
                          .fadeIn(delay: 400.ms, duration: 400.ms),
                    ],

                    // Loading indicator for detail
                    if (_isLoadingDetail)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Center(
                          child: CircularProgressIndicator(
                              color: AppTheme.accentColor),
                        ),
                      ),

                    // Confirm / Reopen Buttons (only for owner when solved)
                    if (widget.isOwner && _issue.canConfirm) ...[
                      const SizedBox(height: 24),
                      _buildActionButtons()
                          .animate()
                          .fadeIn(delay: 500.ms, duration: 400.ms)
                          .slideY(begin: 0.2, end: 0),
                    ],

                    // Info banner for pending issues
                    if (widget.isOwner && _issue.isPending) ...[
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.inProgressColor
                              .withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.info_outline_rounded,
                                color: AppTheme.inProgressColor),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Your report is pending review by the authorities.',
                                style: TextStyle(
                                    color: AppTheme.inProgressColor,
                                    fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Closed info
                    if (_issue.isClosed) ...[
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color:
                              AppTheme.closedColor.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.task_alt_rounded,
                                color: AppTheme.closedColor),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'This issue has been confirmed and closed.',
                                style: TextStyle(
                                    color: AppTheme.closedColor,
                                    fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Reopened info
                    if (_issue.isReopened) ...[
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.reopenedColor
                              .withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.replay_rounded,
                                color: AppTheme.reopenedColor),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'This issue has been reopened for further action.',
                                style: TextStyle(
                                    color: AppTheme.reopenedColor,
                                    fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────
  // Status Banner
  // ───────────────────────────────────────────────────────────────
  Widget _buildStatusBanner() {
    final color = AppTheme.getStatusColor(_issue.status);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(AppTheme.getStatusIcon(_issue.status),
                color: color, size: 28),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Current Status',
                  style: TextStyle(
                      fontSize: 12,
                      color: color.withValues(alpha: 0.8))),
              Text(
                _issue.statusLabel,
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────
  // Details Card
  // ───────────────────────────────────────────────────────────────
  Widget _buildDetailsCard() {
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DetailRow(
            icon: AppTheme.getIssueTypeIcon(_issue.issueType),
            label: 'Issue Type',
            value: _issue.issueType,
          ),
          const Divider(height: 24),
          Text('Description',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(_issue.description,
                style: Theme.of(context).textTheme.bodyLarge),
          ),
          if (_issue.ward != null && _issue.ward!.isNotEmpty) ...[
            const Divider(height: 24),
            _DetailRow(
              icon: Icons.location_city_rounded,
              label: 'Ward',
              value: _issue.ward!,
            ),
          ],
          if (_issue.latitude != null &&
              _issue.longitude != null) ...[
            const Divider(height: 24),
            _DetailRow(
              icon: Icons.gps_fixed_rounded,
              label: 'GPS Location',
              value:
                  '${_issue.latitude!.toStringAsFixed(4)}, ${_issue.longitude!.toStringAsFixed(4)}',
            ),
          ],
          if (_issue.userName != null) ...[
            const Divider(height: 24),
            _DetailRow(
              icon: Icons.person_rounded,
              label: 'Reported By',
              value: _issue.userName!,
            ),
          ],
          if (_issue.createdAt != null) ...[
            const Divider(height: 24),
            _DetailRow(
              icon: Icons.calendar_today_rounded,
              label: 'Created',
              value: DateFormat('MMMM dd, yyyy – hh:mm a')
                  .format(_issue.createdAt!),
            ),
          ],
          if (_issue.updatedAt != null) ...[
            const Divider(height: 24),
            _DetailRow(
              icon: Icons.update_rounded,
              label: 'Last Updated',
              value: DateFormat('MMMM dd, yyyy – hh:mm a')
                  .format(_issue.updatedAt!),
            ),
          ],
        ],
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────
  // Proof / After Image Section
  // ───────────────────────────────────────────────────────────────
  Widget _buildProofSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.successColor.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppTheme.successColor.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color:
                      AppTheme.successColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.verified_rounded,
                    color: AppTheme.successColor, size: 22),
              ),
              const SizedBox(width: 10),
              Text(
                'Resolution Details',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.successColor,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // After image
          if (_issue.afterImageUrl.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                children: [
                  CachedNetworkImage(
                    imageUrl: _issue.afterImageUrl,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      height: 200,
                      color: Colors.grey.shade200,
                      child: const Center(
                          child: CircularProgressIndicator()),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      height: 200,
                      color: Colors.grey.shade200,
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.broken_image,
                              size: 48, color: Colors.grey),
                          SizedBox(height: 4),
                          Text('Image unavailable',
                              style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.successColor
                            .withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'After (Proof)',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Resolution note
          if (_issue.resolutionNote != null &&
              _issue.resolutionNote!.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Resolution Note',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary)),
                  const SizedBox(height: 4),
                  Text(_issue.resolutionNote!,
                      style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],

          // Resolved by / date
          if (_issue.resolvedBy != null)
            _ProofDetailRow(
                icon: Icons.person_rounded,
                label: 'Resolved By',
                value: _issue.resolvedBy!),
          if (_issue.resolvedAt != null)
            _ProofDetailRow(
              icon: Icons.calendar_today_rounded,
              label: 'Resolved Date',
              value: DateFormat('MMMM dd, yyyy – hh:mm a')
                  .format(_issue.resolvedAt!),
            ),
        ],
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────
  // Timeline Section
  // ───────────────────────────────────────────────────────────────
  Widget _buildTimelineSection() {
    final history = _issue.statusHistory;

    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.timeline_rounded,
                    color: AppTheme.primaryColor, size: 22),
              ),
              const SizedBox(width: 10),
              Text(
                'Status Timeline',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (history.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  Icon(Icons.history_rounded,
                      size: 36, color: Colors.grey.shade400),
                  const SizedBox(height: 8),
                  Text(
                    'No status history available',
                    style: TextStyle(
                        color: Colors.grey.shade500, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Current status: ${_issue.statusLabel}',
                    style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            )
          else
            ...List.generate(history.length, (index) {
              final entry = history[index];
              final isLast = index == history.length - 1;
              return _TimelineEntry(
                entry: entry,
                isLast: isLast,
                index: index,
              );
            }),
        ],
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────
  // Action Buttons (Confirm / Reopen)
  // ───────────────────────────────────────────────────────────────
  Widget _buildActionButtons() {
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color:
                      AppTheme.accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.how_to_vote_rounded,
                    color: AppTheme.accentColor, size: 22),
              ),
              const SizedBox(width: 10),
              Text(
                'Your Response',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'The issue has been marked as solved. Please verify and respond:',
            style: TextStyle(
                fontSize: 13, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed:
                        _isConfirming ? null : _confirmIssue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.successColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(12)),
                      elevation: 2,
                    ),
                    icon: _isConfirming
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white),
                          )
                        : const Icon(
                            Icons.check_circle_rounded),
                    label: Text(_isConfirming
                        ? 'Confirming...'
                        : 'Confirm'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed:
                        _isReopening ? null : _reopenIssue,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.reopenedColor,
                      side: const BorderSide(
                          color: AppTheme.reopenedColor),
                      shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(12)),
                    ),
                    icon: _isReopening
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color:
                                    AppTheme.reopenedColor),
                          )
                        : const Icon(Icons.replay_rounded),
                    label: Text(_isReopening
                        ? 'Reopening...'
                        : 'Reopen'),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Timeline Entry Widget
// ─────────────────────────────────────────────────────────────────
class _TimelineEntry extends StatelessWidget {
  final StatusHistoryEntry entry;
  final bool isLast;
  final int index;

  const _TimelineEntry({
    required this.entry,
    required this.isLast,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.getStatusColor(entry.status);
    final icon = AppTheme.getStatusIcon(entry.status);
    final label = AppConstants.statusLabels[entry.status.toUpperCase()] ??
        entry.status;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline line + dot
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: color, width: 2),
                  ),
                  child: Icon(icon, color: color, size: 16),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: Colors.grey.shade300,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Content
          Expanded(
            child: Container(
              margin: EdgeInsets.only(bottom: isLast ? 0 : 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(10),
                border:
                    Border.all(color: color.withValues(alpha: 0.15)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                      ),
                      if (entry.timestamp != null)
                        Text(
                          DateFormat('MMM dd, hh:mm a')
                              .format(entry.timestamp!),
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary),
                        ),
                    ],
                  ),
                  if (entry.changedBy != null ||
                      entry.changedByRole != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'By: ${entry.changedBy ?? 'Unknown'}${entry.changedByRole != null ? ' (${entry.changedByRole})' : ''}',
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary),
                    ),
                  ],
                  if (entry.note != null &&
                      entry.note!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        entry.note!,
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                  if (entry.proofImageUrl.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: entry.proofImageUrl,
                        height: 120,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          height: 120,
                          color: Colors.grey.shade200,
                          child: const Center(
                              child:
                                  CircularProgressIndicator()),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          height: 60,
                          color: Colors.grey.shade100,
                          child: const Center(
                            child: Text(
                                'Proof image unavailable',
                                style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: Duration(milliseconds: 100 * index));
  }
}

// ─────────────────────────────────────────────────────────────────
// Detail Row Widget
// ─────────────────────────────────────────────────────────────────
class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppTheme.primaryColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Proof Detail Row Widget
// ─────────────────────────────────────────────────────────────────
class _ProofDetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ProofDetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.successColor, size: 18),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary)),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
