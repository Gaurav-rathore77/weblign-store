import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '../../constants';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  error?: string;
};

export function PasswordInput({ label, error, style, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={!visible}
          style={[styles.input, !!error && styles.inputError, style]}
          {...rest}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          style={styles.toggle}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.textMuted}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingRight: 48,
    fontSize: 15,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.md,
    height: 52,
    justifyContent: 'center',
  },
  error: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.danger,
  },
});
