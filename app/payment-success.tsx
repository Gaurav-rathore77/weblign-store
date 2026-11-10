import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../src/components';
import { Button } from '../src/components/ui';
import { Colors, Spacing, Typography } from '../src/constants';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>Payment successful</Text>
        <Text style={styles.subtitle}>Your order has been placed and payment verified.</Text>
        {params.orderId ? <Text style={styles.orderId}>Order ID: {params.orderId}</Text> : null}
        <Button label="View orders" onPress={() => router.replace('/orders')} fullWidth style={{ marginTop: Spacing.xl }} />
        <Button label="Continue shopping" variant="secondary" onPress={() => router.replace('/(tabs)')} fullWidth style={{ marginTop: Spacing.sm }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  check: { fontSize: 40, color: Colors.success, fontWeight: '700' },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  orderId: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.md },
});
