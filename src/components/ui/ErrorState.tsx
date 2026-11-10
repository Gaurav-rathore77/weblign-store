import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants';
import { Button } from './Button';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
};

export function ErrorState({ message, onRetry, style }: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message ?? 'Please try again.'}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button label="Retry" onPress={onRetry} />
        </View>
      ) : null}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.lg,
    width: '60%',
  },
});
