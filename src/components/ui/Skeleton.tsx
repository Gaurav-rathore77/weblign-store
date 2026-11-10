import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radii, Spacing } from '../../constants';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, radius = Radii.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius: radius, backgroundColor: Colors.border, opacity }, style]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton height={170} radius={0} />
      <View style={{ padding: Spacing.sm, gap: 8 }}>
        <Skeleton height={12} />
        <Skeleton height={12} width="60%" />
        <Skeleton height={14} width="40%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    width: 170,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
});
