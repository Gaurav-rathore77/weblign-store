import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components';
import { Button, EmptyState, ErrorState } from '../../src/components/ui';
import { useCartStore } from '../../src/stores';
import { validateCoupon } from '../../src/services/cart';
import { Colors, Radii, Spacing, Typography } from '../../src/constants';
import { formatCurrency } from '../../src/utils/format';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discountAmount());
  const delivery = useCartStore((s) => s.deliveryCharge());
  const total = useCartStore((s) => s.total());
  const totalItems = useCartStore((s) => s.totalItems());

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async () => {
    setCouponError(null);
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      const c = await validateCoupon(couponCode.trim(), subtotal);
      if (!c) {
        setCouponError('Invalid or inapplicable coupon.');
      } else {
        setCoupon(c);
        setCouponCode('');
      }
    } catch (e: any) {
      setCouponError(e?.message ?? 'Could not apply coupon.');
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Cart</Text>
        </View>
        <EmptyState title="Your cart is empty" description="Add products to get started." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Cart ({totalItems})</Text>
        <Pressable onPress={() => clear()}>
          <Text style={styles.clear}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => `${i.productId}-${i.size ?? ''}-${i.color ?? ''}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image
              source={{ uri: item.product.imageUrl || 'https://picsum.photos/seed/cart/200/200' }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
              {item.size || item.color ? (
                <Text style={styles.variant}>
                  {[item.size, item.color].filter(Boolean).join(' / ')}
                </Text>
              ) : null}
              <Text style={styles.price}>{formatCurrency(item.product.price, item.product.currency)}</Text>
              {item.product.stock <= 0 ? <Text style={styles.outOfStock}>Out of stock</Text> : null}
            </View>
            <View style={styles.qty}>
              <Pressable onPress={() => updateQuantity(item.productId, item.quantity - 1, item.size, item.color)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>-</Text>
              </Pressable>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <Pressable onPress={() => updateQuantity(item.productId, item.quantity + 1, item.size, item.color)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => removeItem(item.productId, item.size, item.color)} style={styles.remove}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />

      {/* Coupon */}
      <View style={styles.couponRow}>
        <TextInput
          value={couponCode}
          onChangeText={setCouponCode}
          placeholder="Coupon code"
          style={styles.couponInput}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />
        <Pressable onPress={handleApplyCoupon} style={styles.couponBtn} disabled={applying}>
          <Text style={styles.couponBtnText}>{applying ? '...' : 'Apply'}</Text>
        </Pressable>
      </View>
      {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
      {coupon ? (
        <View style={styles.couponApplied}>
          <Text style={styles.couponAppliedText}>Coupon {coupon.code} applied</Text>
          <Pressable onPress={() => setCoupon(null)}>
            <Text style={styles.removeCoupon}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Totals */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal, 'INR')}</Text>
        </View>
        {discount > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.discountValue}>-{formatCurrency(discount, 'INR')}</Text>
          </View>
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery</Text>
          <Text style={styles.totalValue}>{delivery === 0 ? 'FREE' : formatCurrency(delivery, 'INR')}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total, 'INR')}</Text>
        </View>
        <Button label='Checkout' onPress={() => router.push('/checkout')} fullWidth />
        <Text style={styles.note}>Checkout integration coming in the next stage.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.text },
  clear: { color: Colors.danger, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  image: { width: 72, height: 72, borderRadius: 8, backgroundColor: Colors.background },
  info: { flex: 1 },
  name: { ...Typography.bodyBold, color: Colors.text },
  variant: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  price: { ...Typography.caption, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  outOfStock: { ...Typography.small, color: Colors.danger, marginTop: 2 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  qtyText: { fontSize: 14, fontWeight: '600', color: Colors.text, minWidth: 20, textAlign: 'center' },
  remove: { paddingHorizontal: Spacing.sm },
  removeText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  couponRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  couponInput: { flex: 1, height: 44, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, fontSize: 15, color: Colors.text },
  couponBtn: { paddingHorizontal: Spacing.lg, height: 44, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  couponBtnText: { color: '#FFFFFF', fontWeight: '600' },
  couponError: { paddingHorizontal: Spacing.lg, color: Colors.danger, fontSize: 12, marginBottom: Spacing.sm },
  couponApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  couponAppliedText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
  removeCoupon: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  totalLabel: { ...Typography.body, color: Colors.textMuted },
  totalValue: { ...Typography.bodyBold, color: Colors.text },
  discountValue: { ...Typography.bodyBold, color: Colors.success },
  grandTotal: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  grandTotalLabel: { ...Typography.h3, color: Colors.text },
  grandTotalValue: { ...Typography.h3, color: Colors.primary },
  note: { ...Typography.small, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
});
