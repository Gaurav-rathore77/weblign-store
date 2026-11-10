import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../src/components';
import { Button, Input } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Typography } from '../../src/constants';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await resetPassword(values.email.trim());
      setSuccess('Password reset link sent. Check your email.');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to send reset link. Please try again.');
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
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a reset link.
            </Text>
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

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            {success ? <Text style={styles.successBanner}>{success}</Text> : null}

            <Button
              label="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />

            <Link href="/(auth)/login" style={styles.backLink}>
              <Text style={styles.backText}>Back to sign in</Text>
            </Link>
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
  backLink: { alignSelf: 'center', marginTop: Spacing.xl },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
