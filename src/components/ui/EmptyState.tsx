import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
};

export function EmptyState({ title, description, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
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
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
