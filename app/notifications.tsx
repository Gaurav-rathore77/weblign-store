import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components';
import { EmptyState, ErrorState, Loading } from '../src/components/ui';
import { useAuth } from '../src/hooks/useAuth';
import { fetchNotifications, markNotificationRead } from '../src/services/products';
import { Colors, Spacing, Typography } from '../src/constants';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => (user ? fetchNotifications(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  if (!user) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Sign in to view notifications.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message="Could not load notifications." onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          renderItem={({ item }) => (
            <Pressable
              onPress={async () => {
                if (!item.isRead) {
                  await markNotificationRead(item.id);
                  queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                  queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user.id] });
                }
              }}
              style={[styles.card, !item.isRead && styles.unread]}
            >
              <Text style={styles.notifTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.notifBody}>{item.body}</Text> : null}
              <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleString()}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h2, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  unread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifTitle: { ...Typography.bodyBold, color: Colors.text },
  notifBody: { ...Typography.body, color: Colors.textMuted, marginTop: 4 },
  notifTime: { ...Typography.small, color: Colors.textMuted, marginTop: 8 },
});
