import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components';
import {
  EmptyState,
  ErrorState,
  Loading,
  LocationSelector,
  SectionHeader,
} from '../../src/components/ui';
import { ProductCard, BannerCarousel } from '../../src/components/product';
import { ProductCardSkeleton } from '../../src/components/ui/Skeleton';
import { useAuth } from '../../src/hooks/useAuth';
import { useCartStore } from '../../src/stores';
import {
  addToWishlist,
  fetchBanners,
  fetchCategories,
  fetchProducts,
  fetchRecentlyViewed,
  fetchUnreadNotificationCount,
  fetchWishlistIds,
  removeFromWishlist,
} from '../../src/services/products';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../src/constants';

function HorizontalProducts({
  data,
  isLoading,
  isError,
  onRetry,
  onProductPress,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
  emptyText,
  errorMessage,
}: {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  onProductPress: (id: string) => void;
  onAddToCart: (product: any) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  emptyText: string;
  errorMessage?: string;
}) {
  if (isLoading) {
    return (
      <FlatList
        horizontal
        data={Array.from({ length: 4 })}
        keyExtractor={(_, i) => String(i)}
        renderItem={() => <ProductCardSkeleton />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
      />
    );
  }
  if (isError) {
    return (
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <ErrorState message={errorMessage ?? "Could not load products."} onRetry={onRetry} />
      </View>
    );
  }
  if (!data.length) {
    return (
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <EmptyState title={emptyText} />
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => onProductPress(item.id)}
          onAddToCart={() => onAddToCart(item)}
          onToggleWishlist={() => onToggleWishlist(item.id)}
          isWishlisted={wishlistIds.includes(item.id)}
        />
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  const [location, setLocation] = useState('Mumbai, Maharashtra');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const bannersQuery = useQuery({ queryKey: ['banners'], queryFn: fetchBanners });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const trendingQuery = useQuery({ queryKey: ['products', 'trending'], queryFn: () => fetchProducts({ trending: true, limit: 10 }) });
  const bestSellersQuery = useQuery({ queryKey: ['products', 'bestSellers'], queryFn: () => fetchProducts({ bestSeller: true, limit: 10 }) });
  const newArrivalsQuery = useQuery({ queryKey: ['products', 'newArrivals'], queryFn: () => fetchProducts({ newArrival: true, limit: 10 }) });
  const offersQuery = useQuery({ queryKey: ['products', 'offers'], queryFn: () => fetchProducts({ discounted: true, limit: 10 }) });
  const recommendedQuery = useQuery({ queryKey: ['products', 'recommended'], queryFn: () => fetchProducts({ recommended: true, limit: 10 }) });
  const recentlyViewedQuery = useQuery({
    queryKey: ['recentlyViewed', user?.id],
    queryFn: () => (user ? fetchRecentlyViewed(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  const wishlistQuery = useQuery({
    queryKey: ['wishlistIds', user?.id],
    queryFn: () => (user ? fetchWishlistIds(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  const unreadQuery = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: () => (user ? fetchUnreadNotificationCount(user.id) : Promise.resolve(0)),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (wishlistQuery.data) setWishlistIds(wishlistQuery.data);
  }, [wishlistQuery.data]);

  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (wishlistIds.includes(productId)) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      try {
        await removeFromWishlist(user.id, productId);
      } catch {
        setWishlistIds((prev) => [...prev, productId]);
      }
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      try {
        await addToWishlist(user.id, productId);
      } catch {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      }
    }
  };

  const handleAddToCart = (product: any) => {
    addItem(product);
  };

  const handleProductPress = (id: string) => {
    router.push(`/product/${id}`);
  };

  const onRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  const unreadCount = unreadQuery.data ?? 0;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.logo}>Weblign Store</Text>
            <LocationSelector value={location} onChange={setLocation} />
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Search */}
        <Pressable onPress={() => router.push('/search')} style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search products, brands and more</Text>
        </Pressable>

        {/* Banners */}
        {bannersQuery.isLoading ? (
          <View style={styles.bannerSkeleton}>
            <ProductCardSkeleton />
          </View>
        ) : bannersQuery.isError ? (
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            <ErrorState message={bannersQuery.error?.message ?? "Could not load banners."} onRetry={() => bannersQuery.refetch()} />
          </View>
        ) : (
          <BannerCarousel banners={bannersQuery.data ?? []} />
        )}

        {/* Categories */}
        <SectionHeader title="Shop by Category" onSeeAll={() => router.push('/(tabs)/categories')} />
        {categoriesQuery.isLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.categorySkeleton} />
            ))}
          </ScrollView>
        ) : categoriesQuery.isError ? (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <ErrorState message={categoriesQuery.error?.message ?? "Could not load categories."} onRetry={() => categoriesQuery.refetch()} />
          </View>
        ) : (
          <FlatList
            horizontal
            data={categoriesQuery.data ?? []}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/categories', params: { category: item.id } })}
                style={styles.categoryChip}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name="grid-outline" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
              </Pressable>
            )}
          />
        )}

        <View style={{ height: Spacing.lg }} />

        {/* Trending */}
        <SectionHeader title="Trending Now" subtitle="Most popular this week" onSeeAll={() => router.push('/search')} />
        <HorizontalProducts
          data={trendingQuery.data ?? []}
          isLoading={trendingQuery.isLoading}
          isError={trendingQuery.isError}
          onRetry={() => trendingQuery.refetch()}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          emptyText="No trending products yet"
          errorMessage={trendingQuery.error?.message}
        />

        <View style={{ height: Spacing.lg }} />

        {/* Best Sellers */}
        <SectionHeader title="Best Sellers" onSeeAll={() => router.push('/search')} />
        <HorizontalProducts
          data={bestSellersQuery.data ?? []}
          isLoading={bestSellersQuery.isLoading}
          isError={bestSellersQuery.isError}
          onRetry={() => bestSellersQuery.refetch()}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          emptyText="No best sellers yet"
          errorMessage={bestSellersQuery.error?.message}
        />

        <View style={{ height: Spacing.lg }} />

        {/* New Arrivals */}
        <SectionHeader title="New Arrivals" onSeeAll={() => router.push('/search')} />
        <HorizontalProducts
          data={newArrivalsQuery.data ?? []}
          isLoading={newArrivalsQuery.isLoading}
          isError={newArrivalsQuery.isError}
          onRetry={() => newArrivalsQuery.refetch()}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          emptyText="No new arrivals yet"
          errorMessage={newArrivalsQuery.error?.message}
        />

        <View style={{ height: Spacing.lg }} />

        {/* Special Offers */}
        <SectionHeader title="Special Offers" subtitle="Discounts you don't want to miss" onSeeAll={() => router.push('/search')} />
        <HorizontalProducts
          data={offersQuery.data ?? []}
          isLoading={offersQuery.isLoading}
          isError={offersQuery.isError}
          onRetry={() => offersQuery.refetch()}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          emptyText="No offers right now"
          errorMessage={offersQuery.error?.message}
        />

        <View style={{ height: Spacing.lg }} />

        {/* Recommended */}
        <SectionHeader title="Recommended for You" onSeeAll={() => router.push('/search')} />
        <HorizontalProducts
          data={recommendedQuery.data ?? []}
          isLoading={recommendedQuery.isLoading}
          isError={recommendedQuery.isError}
          onRetry={() => recommendedQuery.refetch()}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          emptyText="No recommendations yet"
          errorMessage={recommendedQuery.error?.message}
        />

        {/* Recently Viewed */}
        {user ? (
          <>
            <View style={{ height: Spacing.lg }} />
            <SectionHeader title="Recently Viewed" />
            {recentlyViewedQuery.isLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </ScrollView>
            ) : (recentlyViewedQuery.data ?? []).length ? (
              <FlatList
                horizontal
                data={recentlyViewedQuery.data ?? []}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={() => handleProductPress(item.id)}
                    onAddToCart={() => handleAddToCart(item)}
                    onToggleWishlist={() => handleToggleWishlist(item.id)}
                    isWishlisted={wishlistIds.includes(item.id)}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              />
            ) : (
              <View style={{ paddingHorizontal: Spacing.lg }}>
                <EmptyState title="No recently viewed products" />
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logo: { ...Typography.h2, color: Colors.primary },
  iconBtn: { padding: Spacing.sm, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  searchPlaceholder: { ...Typography.body, color: Colors.textMuted, flex: 1 },
  bannerSkeleton: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  categoryChip: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 80,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    marginBottom: Spacing.xs,
  },
  categoryName: { ...Typography.caption, color: Colors.text, textAlign: 'center' },
  categorySkeleton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.border,
    marginRight: Spacing.md,
  },
});
