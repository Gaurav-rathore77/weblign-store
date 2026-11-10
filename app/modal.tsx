import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components';
import { Colors, Spacing, Typography } from '../src/constants';

export default function ModalScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <Text style={styles.body}>Modal content coming soon.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  title: { ...Typography.h2, color: Colors.text },
  body: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
});
