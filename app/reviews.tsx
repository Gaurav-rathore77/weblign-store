import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Screen } from '../src/components';
import { EmptyState, ErrorState, Loading } from '../src/components/ui';
import { useAuth } from '../src/hooks/useAuth';
import { fetchUserReviews } from '../src/services/reviews';
import { Colors, Spacing, Typography } from '../src/constants';

export default function ReviewsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: () => (user ? fetchUserReviews(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  if (!user) {
    return <Screen><View style={styles.center}><Text style={styles.title}>My reviews</Text><Text style={styles.subtitle}>Sign in to view your reviews.</Text></View></Screen>;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.backText}>Back</Text></Pressable>
        <Text style={styles.title}>My reviews</Text>
      </View>
      {query.isLoading ? <Loading /> : query.isError ? <ErrorState message="Could not load reviews." onRetry={() => query.refetch()} /> : (query.data ?? []).length === 0 ? <EmptyState title="No reviews yet" /> : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(r: any) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                {item.productImage ? <Image source={{ uri: item.productImage }} style={styles.image} contentFit="cover" /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <View style={styles.stars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={14} color={Colors.warning} />
                    ))}
                  </View>
                  {item.title ? <Text style={styles.reviewTitle}>{item.title}</Text> : null}
                  {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
                </View>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingTop: Spacing.md },
  backText: { color: Colors.primary, fontWeight: '600' },
  title: { ...Typography.h2, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  image: { width: 56, height: 56, borderRadius: 8, backgroundColor: Colors.background },
  productName: { ...Typography.bodyBold, color: Colors.text },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewTitle: { ...Typography.bodyBold, color: Colors.text, marginTop: 4 },
  comment: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
});
