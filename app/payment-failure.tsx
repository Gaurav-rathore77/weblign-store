import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../src/components';
import { Button } from '../src/components/ui';
import { Colors, Spacing, Typography } from '../src/constants';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string }>();

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Text style={styles.cross}>✕</Text>
        </View>
        <Text style={styles.title}>Payment failed</Text>
        <Text style={styles.subtitle}>{params.reason ? decodeURIComponent(params.reason) : 'Something went wrong. Please try again.'}</Text>
        <Button label="Retry checkout" onPress={() => router.replace('/checkout')} fullWidth style={{ marginTop: Spacing.xl }} />
        <Button label="Back to cart" variant="secondary" onPress={() => router.replace('/(tabs)/cart')} fullWidth style={{ marginTop: Spacing.sm }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  cross: { fontSize: 40, color: Colors.danger, fontWeight: '700' },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
});
