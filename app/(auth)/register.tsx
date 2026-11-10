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

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().min(10, 'Enter a valid phone number').regex(/^[0-9+\s-]+$/, 'Invalid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await signUp(values.fullName.trim(), values.email.trim(), values.phone.trim(), values.password);
      setSuccess('Account created. Please check your email to verify your account.');
      setTimeout(() => router.replace('/(auth)/login'), 1200);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to create account. Please try again.');
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join Weblign Store today.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full name"
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                />
              )}
            />

            <View style={{ height: Spacing.md }} />

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
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone number"
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
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
                  placeholder="Create a password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={{ height: Spacing.md }} />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Confirm password"
                  placeholder="Repeat your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            {success ? <Text style={styles.successBanner}>{success}</Text> : null}

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/(auth)/login" style={styles.footerLink}>
                <Text style={styles.footerLinkText}> Sign in</Text>
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
  errorBanner: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    color: Colors.danger,
    fontSize: 13,
  },
  successBanner: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    color: Colors.success,
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
