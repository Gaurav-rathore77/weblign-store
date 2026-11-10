import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../src/components';
import { Colors, Spacing, Typography } from '../src/constants';

export default function Page() {
  const router = useRouter();
  const [orders, setOrders] = useState(true);
  const [offers, setOffers] = useState(true);
  const [push, setPush] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('notif_orders'),
      AsyncStorage.getItem('notif_offers'),
      AsyncStorage.getItem('notif_push'),
    ]).then(([o, f, p]) => {
      if (o != null) setOrders(o === 'true');
      if (f != null) setOffers(f === 'true');
      if (p != null) setPush(p === 'true');
    });
  }, []);

  const toggle = (key: string, val: boolean, setter: (b: boolean) => void) => {
    setter(val);
    AsyncStorage.setItem(key, String(val));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Notification settings</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Order updates</Text>
          <Switch value={orders} onValueChange={(v) => toggle('notif_orders', v, setOrders)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Offers & promotions</Text>
          <Switch value={offers} onValueChange={(v) => toggle('notif_offers', v, setOffers)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Push notifications</Text>
          <Switch value={push} onValueChange={(v) => toggle('notif_push', v, setPush)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { ...Typography.body, color: Colors.text },
});
