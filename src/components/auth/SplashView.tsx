import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

export function SplashView() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Weblign Store</Text>
      <Text style={styles.tagline}>Premium shopping, delivered.</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  brand: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontSize: 34,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.sm,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
});
