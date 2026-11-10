import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components';
import { Button, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { fetchProfile } from '../../src/services/profile';
import { Colors, Radii, Spacing, Typography } from '../../src/constants';

type MenuItem = {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchProfile(user.id).then((p) => {
      setProfile(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const displayName = profile?.fullName || user?.user_metadata?.full_name || user?.email || 'Guest';
  const avatarUrl = profile?.avatarUrl || user?.user_metadata?.avatar_url;

  const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Edit profile', onPress: () => router.push('/profile/edit') },
    { icon: 'location-outline', label: 'Manage addresses', onPress: () => router.push('/addresses') },
    { icon: 'receipt-outline', label: 'My orders', onPress: () => router.push('/orders') },
    { icon: 'heart-outline', label: 'My wishlist', onPress: () => router.push('/(tabs)/wishlist') },
    { icon: 'star-outline', label: 'My reviews', onPress: () => router.push('/reviews') },
    { icon: 'card-outline', label: 'Payment preferences', onPress: () => router.push('/payment-preferences') },
    { icon: 'notifications-outline', label: 'Notification settings', onPress: () => router.push('/notification-settings') },
    { icon: 'pricetag-outline', label: 'Promotions & offers', onPress: () => router.push('/promotions') },
    { icon: 'help-circle-outline', label: 'Help & support', onPress: () => router.push('/help') },
    { icon: 'information-circle-outline', label: 'About Weblign Store', onPress: () => router.push('/about') },
    { icon: 'shield-checkmark-outline', label: 'Privacy policy', onPress: () => router.push('/privacy') },
    { icon: 'document-text-outline', label: 'Terms & conditions', onPress: () => router.push('/terms') },
  ];

  if (loading) return <Loading />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {profile?.phone ? <Text style={styles.phone}>{profile.phone}</Text> : null}
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, idx) => (
            <Pressable key={idx} onPress={item.onPress} style={styles.menuItem}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Button label="Logout" variant="danger" onPress={signOut} fullWidth style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: Spacing.md },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  name: { ...Typography.h3, color: Colors.text },
  email: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
  phone: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  menu: { backgroundColor: Colors.surface, borderRadius: Radii.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLabel: { ...Typography.body, color: Colors.text, flex: 1 },
});
