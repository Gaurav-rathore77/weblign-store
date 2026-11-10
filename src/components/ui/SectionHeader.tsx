import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
};

export function SectionHeader({ title, subtitle, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <Text style={styles.seeAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h3, color: Colors.text },
  subtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
});
