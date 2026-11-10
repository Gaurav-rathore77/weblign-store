import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Screen } from '../src/components';
import { Button, EmptyState, ErrorState, Input, Loading } from '../src/components/ui';
import { useAuth } from '../src/hooks/useAuth';
import { addAddress, deleteAddress, fetchAddresses, updateAddress } from '../src/services/addresses';
import { Colors, Radii, Spacing, Typography } from '../src/constants';

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().regex(/^\d{6}$/),
  addressType: z.enum(['home', 'work']),
});

export default function AddressesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => (user ? fetchAddresses(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', addressType: 'home' },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', addressType: 'home' });
    setModalOpen(true);
  };

  const openEdit = (addr: any) => {
    setEditing(addr);
    form.reset({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      addressType: addr.addressType ?? 'home',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: any) => {
    if (!user) return;
    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      line1: values.line1,
      line2: values.line2,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: 'India',
      isDefault: (addressesQuery.data ?? []).length === 0,
      addressType: values.addressType,
    };
    try {
      if (editing) await updateAddress({ ...editing, ...payload });
      else await addAddress(user.id, payload as any);
      await queryClient.invalidateQueries({ queryKey: ['addresses', user.id] });
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save address.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteAddress(id);
          await queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
        } catch (e: any) { Alert.alert('Error', e?.message); }
      } },
    ]);
  };

  if (!user) {
    return <Screen><View style={styles.center}><Text style={styles.title}>Addresses</Text><Text style={styles.subtitle}>Sign in to manage addresses.</Text></View></Screen>;
  }

  const addresses = addressesQuery.data ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.backText}>Back</Text></Pressable>
        <Text style={styles.title}>Addresses</Text>
        <Pressable onPress={openAdd}><Text style={styles.link}>+ Add</Text></Pressable>
      </View>

      {addressesQuery.isLoading ? <Loading /> : addressesQuery.isError ? <ErrorState message="Could not load addresses." onRetry={() => addressesQuery.refetch()} /> : addresses.length === 0 ? <EmptyState title="No addresses" /> : (
        <ScrollView contentContainerStyle={styles.list}>
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.card}>
              <Text style={styles.name}>{addr.fullName}</Text>
              <Text style={styles.text}>{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}</Text>
              <Text style={styles.text}>{addr.city}, {addr.state} - {addr.postalCode}</Text>
              <Text style={styles.text}>{addr.phone}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => openEdit(addr)}><Text style={styles.link}>Edit</Text></Pressable>
                <Pressable onPress={() => handleDelete(addr.id)}><Text style={styles.danger}>Delete</Text></Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Edit address' : 'Add address'}</Text>
              <Pressable onPress={() => setModalOpen(false)}><Text style={styles.link}>Close</Text></Pressable>
            </View>
            <Controller control={form.control} name="fullName" render={({ field: { onChange, onBlur, value } }) => <Input label="Full name" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.fullName?.message as string} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="phone" render={({ field: { onChange, onBlur, value } }) => <Input label="Phone" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.phone?.message as string} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="line1" render={({ field: { onChange, onBlur, value } }) => <Input label="House/Street" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.line1?.message as string} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="line2" render={({ field: { onChange, onBlur, value } }) => <Input label="Area (optional)" value={value} onChangeText={onChange} onBlur={onBlur} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="city" render={({ field: { onChange, onBlur, value } }) => <Input label="City" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.city?.message as string} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="state" render={({ field: { onChange, onBlur, value } }) => <Input label="State" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.state?.message as string} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="postalCode" render={({ field: { onChange, onBlur, value } }) => <Input label="PIN code" keyboardType="number-pad" maxLength={6} value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.postalCode?.message as string} />} />
            <View style={{ height: Spacing.md }} />
            <Controller control={form.control} name="addressType" render={({ field: { onChange, value } }) => (
              <View style={styles.typeRow}>
                {(['home','work'] as const).map((t) => (
                  <Pressable key={t} onPress={() => onChange(t)} style={[styles.typeChip, value === t && styles.typeChipActive]}>
                    <Text style={[styles.typeChipText, value === t && styles.typeChipTextActive]}>{t === 'home' ? 'Home' : 'Work'}</Text>
                  </Pressable>
                ))}
              </View>
            )} />
            <Button label={editing ? 'Update' : 'Save'} onPress={form.handleSubmit(onSubmit)} fullWidth style={{ marginTop: Spacing.lg }} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingTop: Spacing.md },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text },
  link: { color: Colors.primary, fontWeight: '600' },
  danger: { color: Colors.danger, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  name: { ...Typography.bodyBold, color: Colors.text },
  text: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
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
