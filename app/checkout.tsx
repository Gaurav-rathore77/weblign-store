import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Screen } from '../src/components';
import { Button, EmptyState, ErrorState, Input, Loading } from '../src/components/ui';
import { useAuth } from '../src/hooks/useAuth';
import { useCartStore } from '../src/stores';
import {
  addAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from '../src/services/addresses';
import { createOrder, updateOrderPaymentStatus, updateOrderRazorpayId } from '../src/services/orders';
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../src/services/payments';
import { Colors, Radii, Spacing, Typography } from '../src/constants';
import { formatCurrency } from '../src/utils/format';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Enter full name'),
  phone: z.string().min(10, 'Enter valid phone'),
  line1: z.string().min(3, 'Enter house/street'),
  line2: z.string().optional(),
  area: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'Enter city'),
  state: z.string().min(2, 'Enter state'),
  postalCode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit PIN'),
  addressType: z.enum(['home', 'work']),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cartItems = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discountAmount());
  const delivery = useCartStore((s) => s.deliveryCharge());
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clear);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [placing, setPlacing] = useState(false);

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => (user ? fetchAddresses(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const addresses = addressesQuery.data ?? [];
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];

  React.useEffect(() => {
    if (!selectedAddressId && addresses.length) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      addressType: 'home',
    },
  });

  const openAdd = () => {
    setEditingAddress(null);
    form.reset({
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      addressType: 'home',
    });
    setAddressModalOpen(true);
  };

  const openEdit = (addr: any) => {
    setEditingAddress(addr);
    form.reset({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      area: (addr as any).area ?? '',
      landmark: (addr as any).landmark ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      addressType: addr.addressType ?? 'home',
    });
    setAddressModalOpen(true);
  };

  const onSubmitAddress = async (values: AddressForm) => {
    if (!user) return;
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: 'India',
        isDefault: addresses.length === 0,
        addressType: values.addressType,
      } as any;
      if (editingAddress) {
        await updateAddress({ ...editingAddress, ...payload });
      } else {
        const created = await addAddress(user.id, payload);
        setSelectedAddressId(created.id);
      }
      await queryClient.invalidateQueries({ queryKey: ['addresses', user.id] });
      setAddressModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save address.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(id);
            if (selectedAddressId === id) setSelectedAddressId(null);
            await queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Could not delete address.');
          }
        },
      },
    ]);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Empty cart', 'Add items before checkout.');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Address required', 'Please select or add a delivery address.');
      return;
    }

    setPlacing(true);
    let orderId: string | null = null;
    try {
      orderId = await createOrder({
        userId: user.id,
        addressId: selectedAddress.id,
        items: cartItems,
        subtotal,
        discount,
        deliveryCharge: delivery,
        total,
        couponCode: coupon?.code ?? null,
      });

      const rzpOrder = await createRazorpayOrder(total, 'INR', orderId);
      await updateOrderRazorpayId(orderId, rzpOrder.id);

      const keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) throw new Error('Razorpay key not configured');

      const paymentResult = await openRazorpayCheckout({
        key: keyId,
        amount: rzpOrder.amount / 100,
        currency: rzpOrder.currency,
        name: 'Weblign Store',
        description: 'Order ' + orderId,
        order_id: rzpOrder.id,
        prefill: {
          name: selectedAddress.fullName,
          contact: selectedAddress.phone,
          email: user.email ?? '',
        },
        theme: { color: '#2563EB' },
      });

      const verified = await verifyRazorpayPayment({
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
        order_id: orderId,
      });

      if (!verified?.verified) {
        throw new Error('Payment verification failed');
      }

      await clearCart();
      router.replace(('/payment-success?orderId=' + orderId) as any);
    } catch (e: any) {
      const msg = (e && (e.description || e.message)) || 'Payment failed';
      if (orderId) {
        const cancelled = /cancel/i.test(msg);
        try {
          await updateOrderPaymentStatus(orderId, cancelled ? 'cancelled' : 'failed');
        } catch (err) {}
      }
      if (/cancel/i.test(msg)) {
        router.push(('/payment-failure?reason=cancelled') as any);
      } else {
        router.push(('/payment-failure?reason=' + encodeURIComponent(msg)) as any);
      }
    } finally {
      setPlacing(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>Sign in to continue.</Text>
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Checkout</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <Pressable onPress={openAdd}>
              <Text style={styles.link}>+ Add new</Text>
            </Pressable>
          </View>

          {addressesQuery.isLoading ? (
            <Loading />
          ) : addressesQuery.isError ? (
            <ErrorState message="Could not load addresses." onRetry={() => addressesQuery.refetch()} />
          ) : addresses.length === 0 ? (
            <EmptyState title="No addresses" description="Add a delivery address to continue." />
          ) : (
            addresses.map((addr) => (
              <Pressable
                key={addr.id}
                onPress={() => setSelectedAddressId(addr.id)}
                style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressName}>{addr.fullName}</Text>
                  <Text style={styles.addressText}>
                    {addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}, {addr.city}, {addr.state} - {addr.postalCode}
                  </Text>
                  <Text style={styles.addressText}>{addr.phone}</Text>
                  {addr.isDefault ? <Text style={styles.defaultTag}>Default</Text> : null}
                </View>
                <View style={styles.addressActions}>
                  <Pressable onPress={() => openEdit(addr)}>
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(addr.id)}>
                    <Text style={styles.danger}>Delete</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          {cartItems.map((item) => (
            <View key={item.productId + (item.size ?? '') + (item.color ?? '')} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {item.product.name} x{item.quantity}
              </Text>
              <Text style={styles.summaryPrice}>{formatCurrency(item.product.price * item.quantity, item.product.currency)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal, 'INR')}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.discountValue}>-{formatCurrency(discount, 'INR')}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>{delivery === 0 ? 'FREE' : formatCurrency(delivery, 'INR')}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total, 'INR')}</Text>
          </View>
        </View>

        <Button
          label={placing ? 'Processing...' : 'Pay now'}
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={cartItems.length === 0 || !selectedAddress}
          fullWidth
        />
      </ScrollView>

      <Modal visible={addressModalOpen} transparent animationType="slide" onRequestClose={() => setAddressModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAddress ? 'Edit address' : 'Add address'}</Text>
              <Pressable onPress={() => setAddressModalOpen(false)}>
                <Text style={styles.link}>Close</Text>
              </Pressable>
            </View>

            <Controller control={form.control} name="fullName" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Full name" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.fullName?.message} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Mobile number" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.phone?.message} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="line1" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="House no. / Street" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.line1?.message} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="line2" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Area (optional)" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="landmark" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Landmark (optional)" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="city" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="City" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.city?.message} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="state" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="State" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.state?.message} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="postalCode" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="PIN code" keyboardType="number-pad" maxLength={6} value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.postalCode?.message} />
            )} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="addressType" render={({ field: { onChange, value } }) => (
              <View style={styles.typeRow}>
                {(['home', 'work'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => onChange(t)}
                    style={[styles.typeChip, value === t && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeChipText, value === t && styles.typeChipTextActive]}>
                      {t === 'home' ? 'Home' : 'Work'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )} />

            <Button
              label={editingAddress ? 'Update address' : 'Save address'}
              onPress={form.handleSubmit(onSubmitAddress)}
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  pageTitle: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  link: { color: Colors.primary, fontWeight: '600' },
  danger: { color: Colors.danger, fontWeight: '600' },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressCardActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  addressName: { ...Typography.bodyBold, color: Colors.text },
  addressText: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  defaultTag: { ...Typography.small, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  addressActions: { justifyContent: 'space-between', marginLeft: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryName: { ...Typography.body, color: Colors.text, flex: 1, marginRight: Spacing.sm },
  summaryPrice: { ...Typography.bodyBold, color: Colors.text },
  summaryLabel: { ...Typography.body, color: Colors.textMuted },
  summaryValue: { ...Typography.bodyBold, color: Colors.text },
  discountValue: { ...Typography.bodyBold, color: Colors.success },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  totalRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { ...Typography.h3, color: Colors.text },
  totalValue: { ...Typography.h3, color: Colors.primary },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: { flex: 1, height: 44, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { ...Typography.body, color: Colors.text },
  typeChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
});
