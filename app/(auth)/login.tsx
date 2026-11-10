import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../src/components';
import { Button, Input } from '../../src/components/ui';
import { PasswordInput } from '../../src/components/ui/PasswordInput';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Typography } from '../../src/constants';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(values.email.trim(), values.password);
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <View style={{ height: Spacing.md }} />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Link>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Weblign Store?</Text>
              <Link href="/(auth)/register" style={styles.footerLink}>
                <Text style={styles.footerLinkText}> Create account</Text>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: { marginBottom: Spacing.xl },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.xs },
  form: { width: '100%' },
  forgotLink: { alignSelf: 'flex-end', marginTop: Spacing.sm },
  forgotText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  errorBanner: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    color: Colors.danger,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: {},
  footerLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
