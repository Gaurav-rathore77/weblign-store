import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../src/components';
import { EmptyState, ErrorState, Loading } from '../src/components/ui';
import { fetchPromotions } from '../src/services/promotions';
import { Colors, Spacing, Typography } from '../src/constants';
import { Image } from 'expo-image';

export default function PromotionsScreen() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['promotions'], queryFn: fetchPromotions });

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.backText}>Back</Text></Pressable>
        <Text style={styles.title}>Promotions & Offers</Text>
      </View>
      {query.isLoading ? <Loading /> : query.isError ? <ErrorState message="Could not load promotions." onRetry={() => query.refetch()} /> : (query.data ?? []).length === 0 ? <EmptyState title="No promotions right now" /> : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(p: any) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.card}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" /> : null}
              <Text style={styles.promoTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.promoBody}>{item.body}</Text> : null}
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
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  image: { width: '100%', height: 160, borderRadius: 8, marginBottom: Spacing.md, backgroundColor: Colors.background },
  promoTitle: { ...Typography.h3, color: Colors.text },
  promoBody: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
});
