import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { ProductCard } from '../../src/components/product';
import { useAuth } from '../../src/hooks/useAuth';
import { useCartStore } from '../../src/stores';
import { fetchProductsByIds, fetchWishlistIds, removeFromWishlist } from '../../src/services/products';
import { Colors, Radii, Spacing, Typography } from '../../src/constants';

export default function WishlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  const idsQuery = useQuery({
    queryKey: ['wishlistIds', user?.id],
    queryFn: () => (user ? fetchWishlistIds(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const productsQuery = useQuery({
    queryKey: ['wishlistProducts', idsQuery.data],
    queryFn: () => fetchProductsByIds(idsQuery.data ?? []),
    enabled: !!idsQuery.data,
  });

  if (!user) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Wishlist</Text>
          <Text style={styles.subtitle}>Sign in to save your favorite products.</Text>
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.btn}>
            <Text style={styles.btnText}>Sign In</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(user.id, productId);
      await queryClient.invalidateQueries({ queryKey: ['wishlistIds', user.id] });
    } catch {}
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
      </View>

      {idsQuery.isLoading || productsQuery.isLoading ? (
        <Loading />
      ) : idsQuery.isError || productsQuery.isError ? (
        <ErrorState message="Could not load wishlist." onRetry={() => { idsQuery.refetch(); productsQuery.refetch(); }} />
      ) : (productsQuery.data ?? []).length === 0 ? (
        <EmptyState title="Your wishlist is empty" description="Tap the heart on a product to save it." />
      ) : (
        <FlatList
          data={productsQuery.data ?? []}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                onAddToCart={() => { addItem(item); handleRemove(item.id); }}
                onToggleWishlist={() => handleRemove(item.id)}
                isWishlisted
                compact
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  btn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
  grid: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  gridItem: { marginBottom: Spacing.md },
});
