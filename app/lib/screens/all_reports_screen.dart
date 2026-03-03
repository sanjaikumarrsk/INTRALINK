import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/issue_provider.dart';
import '../widgets/issue_card.dart';
import '../widgets/common_widgets.dart';
import '../widgets/bg_wrapper.dart';
import 'issue_detail_screen.dart';

class AllReportsScreen extends StatelessWidget {
  const AllReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = Provider.of<AuthProvider>(context, listen: false).user?.id;

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Reports'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              Provider.of<IssueProvider>(context, listen: false).fetchIssues();
            },
          ),
        ],
      ),
      body: BgWrapper(
        child: Consumer<IssueProvider>(
          builder: (context, issueProvider, _) {
            if (issueProvider.isLoading && issueProvider.allIssues.isEmpty) {
              return const LoadingWidget(message: 'Loading reports...');
            }

            if (issueProvider.error != null && issueProvider.allIssues.isEmpty) {
              return ErrorRetryWidget(
                message: issueProvider.error!,
                onRetry: () => issueProvider.fetchIssues(),
              );
            }

            if (issueProvider.allIssues.isEmpty) {
              return const EmptyWidget(
                icon: Icons.list_alt_rounded,
                title: 'No Reports Found',
                subtitle: 'Reports from all citizens will appear here',
              );
            }

            return RefreshIndicator(
              onRefresh: () => issueProvider.fetchIssues(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: issueProvider.allIssues.length,
                itemBuilder: (context, index) {
                  final issue = issueProvider.allIssues[index];
                  final isOwner = issue.userId == userId;
                  return IssueCard(
                    issue: issue,
                    showUser: true,
                    index: index,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => IssueDetailScreen(
                            issue: issue,
                            isOwner: isOwner,
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
