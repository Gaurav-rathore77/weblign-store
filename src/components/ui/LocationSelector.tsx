import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radii, Spacing, Typography } from '../../constants';

const STORAGE_KEY = 'weblign_selected_location';

const LOCATIONS = [
  'Mumbai, Maharashtra',
  'Delhi, Delhi',
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
];

type LocationSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) onChange(stored);
    });
  }, [onChange]);

  const select = async (loc: string) => {
    onChange(loc);
    await AsyncStorage.setItem(STORAGE_KEY, loc);
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <Ionicons name="location-outline" size={16} color={Colors.primary} />
        <Text style={styles.text} numberOfLines={1}>
          {value || 'Select location'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Delivery location</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView>
              {LOCATIONS.map((loc) => (
                <Pressable key={loc} onPress={() => select(loc)} style={styles.option}>
                  <Ionicons
                    name={value === loc ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={value === loc ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={styles.optionText}>{loc}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 200,
  },
  text: { ...Typography.caption, color: Colors.text, fontWeight: '600', flexShrink: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.h3, color: Colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { ...Typography.body, color: Colors.text },
});
