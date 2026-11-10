import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../src/components';
import { EmptyState, ErrorState, Loading } from '../src/components/ui';
import { useAuth } from '../src/hooks/useAuth';
import { fetchOrders } from '../src/services/orders';
import { Colors, Spacing, Typography } from '../src/constants';
import { formatCurrency } from '../src/utils/format';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ placed?: string }>();

  const ordersQuery = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => (user ? fetchOrders(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  if (!user) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Sign in to view your orders.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {params.placed ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Order placed successfully!</Text>
        </View>
      ) : null}

      {ordersQuery.isLoading ? (
        <Loading />
      ) : ordersQuery.isError ? (
        <ErrorState message="Could not load orders." onRetry={() => ordersQuery.refetch()} />
      ) : (ordersQuery.data ?? []).length === 0 ? (
        <EmptyState title="No orders yet" description="Your placed orders will appear here." />
      ) : (
        <FlatList
          data={ordersQuery.data ?? []}
          keyExtractor={(o: any) => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => (
            <Pressable onPress={() => router.push(`/order/${item.id}`)} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                <Text style={[styles.status, statusColor(item.status)]}>{item.status.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <View style={styles.row}>
                <Text style={styles.total}>{formatCurrency(Number(item.total), 'INR')}</Text>
                <Text style={styles.link}>View details</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'delivered': return { color: Colors.success };
    case 'cancelled':
    case 'returned':
    case 'refunded': return { color: Colors.danger };
    default: return { color: Colors.primary };
  }
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { padding: Spacing.sm },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  successBanner: { margin: Spacing.lg, padding: Spacing.md, borderRadius: 12, backgroundColor: '#DCFCE7' },
  successText: { color: Colors.success, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { ...Typography.bodyBold, color: Colors.text },
  status: { ...Typography.caption, fontWeight: '600', textTransform: 'capitalize' },
  meta: { ...Typography.small, color: Colors.textMuted, marginTop: 4 },
  total: { ...Typography.h3, color: Colors.primary, marginTop: Spacing.sm },
  link: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
});
