import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/issue_provider.dart';
import '../widgets/issue_card.dart';
import '../widgets/common_widgets.dart';
import '../widgets/bg_wrapper.dart';
import 'issue_detail_screen.dart';

class MyReportsScreen extends StatelessWidget {
  const MyReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Reports'),
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
            if (issueProvider.isLoading && issueProvider.myIssues.isEmpty) {
              return const LoadingWidget(message: 'Loading your reports...');
            }

            if (issueProvider.myIssues.isEmpty) {
              return const EmptyWidget(
                icon: Icons.description_outlined,
                title: 'No Reports Yet',
                subtitle: 'Your submitted reports will appear here',
              );
            }

            return RefreshIndicator(
              onRefresh: () => issueProvider.fetchIssues(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: issueProvider.myIssues.length,
                itemBuilder: (context, index) {
                  final issue = issueProvider.myIssues[index];
                  return IssueCard(
                    issue: issue,
                    index: index,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => IssueDetailScreen(
                            issue: issue,
                            isOwner: true,
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
