import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Screen } from '../../src/components';
import { Button, EmptyState, ErrorState, Input, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useCartStore } from '../../src/stores';
import {
  cancelOrder,
  fetchAddressById,
  fetchOrder,
  fetchReturnRequests,
  requestReturn,
} from '../../src/services/orders';
import { Colors, Radii, Spacing, Typography } from '../../src/constants';
import { formatCurrency } from '../../src/utils/format';

const STATUS_STEPS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [acting, setActing] = useState(false);

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id as string),
    enabled: !!id,
  });

  const order = orderQuery.data;

  const addressQuery = useQuery({
    queryKey: ['address', order?.addressId],
    queryFn: () => (order?.addressId ? fetchAddressById(order.addressId) : Promise.resolve(null)),
    enabled: !!order?.addressId,
  });

  const returnsQuery = useQuery({
    queryKey: ['returnRequests', id],
    queryFn: () => fetchReturnRequests(id as string),
    enabled: !!id,
  });

  const canCancel = !!order && ['pending', 'confirmed', 'processing'].includes(order.status);
  const canReturn = !!order && order.status === 'delivered';

  const handleCancel = () => {
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setActing(true);
          try {
            await cancelOrder(id as string);
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
            Alert.alert('Cancelled', 'Your order has been cancelled.');
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Could not cancel order.');
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      Alert.alert('Reason required', 'Please enter a return reason.');
      return;
    }
    if (!user) return;
    setActing(true);
    try {
      await requestReturn(id as string, user.id, returnReason.trim());
      setReturnOpen(false);
      setReturnReason('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['returnRequests', id] });
      Alert.alert('Return requested', 'Your return request has been submitted.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not request return.');
    } finally {
      setActing(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    order.items.forEach((item) => addItem(item.product, item.quantity, item.size, item.color));
    Alert.alert('Reordered', 'Items added to your cart.');
    router.push('/(tabs)/cart');
  };

  const handleInvoice = async () => {
    if (!order) return;
    const addr = addressQuery.data;
    const html = `
      <html><body style="font-family: Arial; padding: 20px;">
        <h1>Weblign Store Invoice</h1>
        <p>Order ID: ${order.id}</p>
        <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
        <p>Status: ${order.status}</p>
        <p>Payment: ${order.paymentStatus ?? ''}</p>
        ${addr ? `<p>Ship to: ${addr.full_name}, ${addr.line1}, ${addr.city}, ${addr.state} - ${addr.postal_code}</p>` : ''}
        <h3>Items</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr><th style="text-align:left;border-bottom:1px solid #ccc;">Item</th><th>Qty</th><th>Price</th></tr>
          ${order.items.map((i) => `<tr><td>${i.product.name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:right;">${i.product.price}</td></tr>`).join('')}
        </table>
        <h3>Total: ${order.total}</h3>
      </body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Invoice', 'Invoice generated at ' + uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate invoice.');
    }
  };

  if (orderQuery.isLoading) return <Loading message="Loading order..." />;
  if (orderQuery.isError || !order) {
    return (
      <Screen>
        <ErrorState message="Order not found." onRetry={() => orderQuery.refetch()} />
      </Screen>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.meta}>Placed on {new Date(order.createdAt).toLocaleString()}</Text>

        {/* Status timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order status</Text>
          {STATUS_STEPS.map((step, idx) => {
            const done = currentStepIndex >= idx && currentStepIndex >= 0;
            const active = currentStepIndex === idx;
            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]} />
                <Text style={[styles.stepText, done && styles.stepTextDone]}>{step.replace(/_/g, ' ')}</Text>
              </View>
            );
          })}
          {order.status === 'cancelled' ? <Text style={styles.cancelledText}>Order cancelled</Text> : null}
          {order.status === 'returned' ? <Text style={styles.cancelledText}>Order returned</Text> : null}
          {order.status === 'refunded' ? <Text style={styles.cancelledText}>Order refunded</Text> : null}
        </View>

        {/* Tracking */}
        {order.trackingNumber ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            <Text style={styles.text}>Carrier: {order.carrier ?? 'N/A'}</Text>
            <Text style={styles.text}>Tracking number: {order.trackingNumber}</Text>
            {order.estimatedDelivery ? <Text style={styles.text}>Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</Text> : null}
          </View>
        ) : null}

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.size ? `Size: ${item.size} ` : ''}{item.color ? `Color: ${item.color} ` : ''}x{item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.product.price * item.quantity, 'INR')}</Text>
            </View>
          ))}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          {addressQuery.data ? (
            <View>
              <Text style={styles.text}>{addressQuery.data.full_name}</Text>
              <Text style={styles.text}>{addressQuery.data.line1}</Text>
              <Text style={styles.text}>{addressQuery.data.city}, {addressQuery.data.state} - {addressQuery.data.postal_code}</Text>
              <Text style={styles.text}>{addressQuery.data.phone}</Text>
            </View>
          ) : (
            <Text style={styles.text}>No address available.</Text>
          )}
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.text}>Status: {order.paymentStatus ?? 'pending'}</Text>
          {order.paymentId ? <Text style={styles.text}>Payment ID: {order.paymentId}</Text> : null}
          <Text style={styles.text}>Refund status: {order.refundStatus ?? 'none'}</Text>
          {order.refundAmount ? <Text style={styles.text}>Refund amount: {formatCurrency(order.refundAmount, 'INR')}</Text> : null}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.totalRow}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>{formatCurrency(order.subtotal ?? 0, 'INR')}</Text></View>
          <View style={styles.totalRow}><Text style={styles.label}>Discount</Text><Text style={styles.value}>-{formatCurrency(order.discount ?? 0, 'INR')}</Text></View>
          <View style={styles.totalRow}><Text style={styles.label}>Delivery</Text><Text style={styles.value}>{formatCurrency(order.deliveryCharge ?? 0, 'INR')}</Text></View>
          <View style={styles.totalRow}><Text style={styles.label}>Total</Text><Text style={styles.total}>{formatCurrency(order.total, 'INR')}</Text></View>
        </View>

        {/* Returns */}
        {returnsQuery.data && returnsQuery.data.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Return requests</Text>
            {returnsQuery.data.map((r) => (
              <View key={r.id} style={styles.returnCard}>
                <Text style={styles.text}>Reason: {r.reason}</Text>
                <Text style={styles.text}>Status: {r.status}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Download invoice" onPress={handleInvoice} fullWidth />
          <Button label="Reorder" variant="secondary" onPress={handleReorder} fullWidth style={{ marginTop: Spacing.sm }} />
          {canCancel ? (
            <Button label="Cancel order" variant="danger" onPress={handleCancel} loading={acting} fullWidth style={{ marginTop: Spacing.sm }} />
          ) : null}
          {canReturn ? (
            <Button label="Request return" variant="secondary" onPress={() => setReturnOpen(true)} fullWidth style={{ marginTop: Spacing.sm }} />
          ) : null}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <Modal visible={returnOpen} transparent animationType="slide" onRequestClose={() => setReturnOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Request return</Text>
            <Input
              label="Reason"
              value={returnReason}
              onChangeText={setReturnReason}
              placeholder="Why do you want to return?"
            />
            <Button label="Submit" onPress={handleReturn} loading={acting} fullWidth style={{ marginTop: Spacing.lg }} />
            <Pressable onPress={() => setReturnOpen(false)} style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <Text style={styles.link}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  section: { marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  text: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  stepDotDone: { backgroundColor: Colors.success },
  stepDotActive: { backgroundColor: Colors.primary },
  stepText: { ...Typography.body, color: Colors.textMuted, textTransform: 'capitalize' },
  stepTextDone: { color: Colors.text, fontWeight: '600' },
  cancelledText: { ...Typography.bodyBold, color: Colors.danger, marginTop: Spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName: { ...Typography.bodyBold, color: Colors.text },
  itemMeta: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  itemPrice: { ...Typography.bodyBold, color: Colors.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  label: { ...Typography.body, color: Colors.textMuted },
  value: { ...Typography.bodyBold, color: Colors.text },
  total: { ...Typography.h3, color: Colors.primary },
  returnCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  actions: { marginTop: Spacing.xl },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  link: { color: Colors.primary, fontWeight: '600' },
});
