import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen } from '../../src/components';
import { Button } from '../../src/components/ui';
import { Colors, Spacing, Typography } from '../../src/constants';

export default function WelcomeScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(700)} style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>W</Text>
          </View>
          <Text style={styles.brand}>Weblign Store</Text>
          <Text style={styles.tagline}>Discover premium products, curated for you.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(700).delay(200)} style={styles.actions}>
          <Link href="/(auth)/login" asChild>
            <Button label="Sign In" fullWidth />
          </Link>
          <View style={{ height: Spacing.md }} />
          <Link href="/(auth)/register" asChild>
            <Button label="Create Account" variant="secondary" fullWidth />
          </Link>
          <Text style={styles.terms}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Colors.primary },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: Spacing.xxl,
  },
  hero: { alignItems: 'center' },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoLetter: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.primary,
  },
  brand: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontSize: 32,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actions: { width: '100%' },
  terms: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
