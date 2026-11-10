import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../src/components';
import { Colors, Spacing, Typography } from '../src/constants';

export default function Page() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>help</Text>
        <Text style={styles.body}>For help and support, contact support@weblignstore.com.</Text>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.md, textTransform: 'capitalize' },
  body: { ...Typography.body, color: Colors.textMuted, lineHeight: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { ...Typography.body, color: Colors.text },
});
