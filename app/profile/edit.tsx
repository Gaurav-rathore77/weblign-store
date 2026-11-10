import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components';
import { Button, Input, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { fetchProfile, pickAndUploadAvatar, upsertProfile } from '../../src/services/profile';
import { Colors, Spacing, Typography } from '../../src/constants';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchProfile(user.id).then((p) => {
      setFullName(p?.fullName ?? user.user_metadata?.full_name ?? '');
      setPhone(p?.phone ?? user.user_metadata?.phone ?? '');
      setAvatarUrl(p?.avatarUrl ?? user.user_metadata?.avatar_url ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handlePickAvatar = async () => {
    if (!user) return;
    try {
      const url = await pickAndUploadAvatar(user.id);
      if (url) {
        setAvatarUrl(url);
        await upsertProfile(user.id, { avatarUrl: url });
      }
    } catch (e: any) {
      alert(e?.message ?? 'Could not upload avatar');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile(user.id, { fullName, phone, avatarUrl: avatarUrl ?? undefined });
      router.back();
    } catch (e: any) {
      alert(e?.message ?? 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLetter}>{(fullName || 'U').charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Pressable onPress={handlePickAvatar} style={styles.changePhoto}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </Pressable>
        </View>

        <Input label="Full name" value={fullName} onChangeText={setFullName} />
        <View style={{ height: Spacing.md }} />
        <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <View style={{ height: Spacing.md }} />
        <Input label="Email" value={user?.email ?? ''} editable={false} />
        <Text style={styles.hint}>Email cannot be changed.</Text>

        <Button label="Save changes" onPress={handleSave} loading={saving} fullWidth style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.lg },
  avatarWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 40, fontWeight: '700', color: '#FFFFFF' },
  changePhoto: { marginTop: Spacing.sm },
  changePhotoText: { color: Colors.primary, fontWeight: '600' },
  hint: { ...Typography.small, color: Colors.textMuted, marginTop: Spacing.xs },
});
