import 'package:flutter_test/flutter_test.dart';
import 'package:infralink/main.dart';

void main() {
  testWidgets('App launches smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const InfralinkApp());
    await tester.pump();
    expect(find.text('INFRALINK'), findsOneWidget);
  });
}
