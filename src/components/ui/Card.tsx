import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../../constants';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
};

export function Card({ children, style, padding = Spacing.md }: CardProps) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    ...Shadows.sm,
  },
});
