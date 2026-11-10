import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants';

type LoadingProps = {
  message?: string;
  style?: ViewStyle;
};

export function Loading({ message, style }: LoadingProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.md,
    color: Colors.textMuted,
    fontSize: 14,
  },
});
