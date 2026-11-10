import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Screen } from '../../src/components';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { ProductCard } from '../../src/components/product';
import {
  fetchBrands,
  fetchCategories,
  fetchProductsListing,
} from '../../src/services/products';
import { useCartStore } from '../../src/stores';
import { Colors, Radii, Spacing, Typography } from '../../src/constants';
import { formatCurrency } from '../../src/utils/format';

const SORT_OPTIONS: { key: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating'; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'popular', label: 'Popularity' },
  { key: 'rating', label: 'Customer Rating' },
];

const PAGE_SIZE = 20;

export default function CategoriesScreen() {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category ?? null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  React.useEffect(() => {
    if (params.category) setSelectedCategory(params.category);
  }, [params.category]);

  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating'>('newest');
  const [brand, setBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStock, setInStock] = useState(false);
  const [discounted, setDiscounted] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const brandsQuery = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });

  const categories = categoriesQuery.data ?? [];
  const rootCategories = categories.filter((c) => !c.parentId);
  const subcategories = selectedCategory
    ? categories.filter((c) => c.parentId === selectedCategory)
    : [];

  const categoryIds = useMemo(() => {
    if (selectedSubcategory) return [selectedSubcategory];
    if (selectedCategory) {
      const childIds = categories.filter((c) => c.parentId === selectedCategory).map((c) => c.id);
      return [selectedCategory, ...childIds];
    }
    return undefined;
  }, [selectedCategory, selectedSubcategory, categories]);

  const listingParams = {
    categoryIds,
    brand,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    minRating,
    inStock,
    discounted,
    sortBy,
  };

  const listingQuery = useInfiniteQuery({
    queryKey: ['productsListing', listingParams],
    queryFn: ({ pageParam = 0 }) =>
      fetchProductsListing({ ...listingParams, page: pageParam as number, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.products.length === PAGE_SIZE ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
  });

  const products = listingQuery.data?.pages.flatMap((p) => p.products) ?? [];
  const totalCount = listingQuery.data?.pages[0]?.count ?? 0;

  const activeFilterCount =
    (brand ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (inStock ? 1 : 0) +
    (discounted ? 1 : 0);

  const clearFilters = () => {
    setBrand(null);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(null);
    setInStock(false);
    setDiscounted(false);
  };

  const renderCategory = ({ item }: { item: any }) => {
    const active = selectedCategory === item.id;
    return (
      <Pressable
        onPress={() => {
          setSelectedCategory(active ? null : item.id);
          setSelectedSubcategory(null);
        }}
        style={[styles.categoryCard, active && styles.categoryCardActive]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} contentFit="cover" />
        ) : (
          <View style={styles.categoryIcon}>
            <Ionicons name={(item.icon as any) || 'grid-outline'} size={22} color={active ? '#FFFFFF' : Colors.primary} />
          </View>
        )}
        <Text style={[styles.categoryName, active && styles.categoryNameActive]} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setSortOpen(true)} style={styles.actionBtn}>
            <Ionicons name="swap-vertical" size={18} color={Colors.text} />
            <Text style={styles.actionText}>Sort</Text>
          </Pressable>
          <Pressable onPress={() => setFilterOpen(true)} style={styles.actionBtn}>
            <Ionicons name="filter" size={18} color={Colors.text} />
            <Text style={styles.actionText}>Filter</Text>
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {categoriesQuery.isLoading ? (
        <Loading />
      ) : categoriesQuery.isError ? (
        <ErrorState message="Could not load categories." onRetry={() => categoriesQuery.refetch()} />
      ) : (
        <FlatList
          horizontal
          data={rootCategories}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={renderCategory}
        />
      )}

      {subcategories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatList}>
          <Pressable
            onPress={() => setSelectedSubcategory(null)}
            style={[styles.subcatChip, !selectedSubcategory && styles.subcatChipActive]}
          >
            <Text style={[styles.subcatText, !selectedSubcategory && styles.subcatTextActive]}>All</Text>
          </Pressable>
          {subcategories.map((sc) => (
            <Pressable
              key={sc.id}
              onPress={() => setSelectedSubcategory(sc.id)}
              style={[styles.subcatChip, selectedSubcategory === sc.id && styles.subcatChipActive]}
            >
              <Text style={[styles.subcatText, selectedSubcategory === sc.id && styles.subcatTextActive]}>{sc.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {listingQuery.isLoading ? 'Loading...' : `${totalCount} product${totalCount !== 1 ? 's' : ''}`}
        </Text>
        {activeFilterCount > 0 ? (
          <Pressable onPress={clearFilters}>
            <Text style={styles.clearText}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      {listingQuery.isLoading ? (
        <Loading />
      ) : listingQuery.isError ? (
        <ErrorState message="Could not load products." onRetry={() => listingQuery.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting filters or category." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p, idx) => `${p.id}-${idx}`}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          onEndReached={() => {
            if (listingQuery.hasNextPage && !listingQuery.isFetchingNextPage) {
              listingQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={listingQuery.isFetchingNextPage ? <Loading /> : undefined}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                onAddToCart={() => addItem(item)}
                compact
              />
            </View>
          )}
        />
      )}

      {/* Sort modal */}
      <Modal visible={sortOpen} transparent animationType="slide" onRequestClose={() => setSortOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  setSortBy(opt.key);
                  setSortOpen(false);
                }}
                style={styles.modalOption}
              >
                <Text style={[styles.modalOptionText, sortBy === opt.key && styles.modalOptionActive]}>{opt.label}</Text>
                {sortBy === opt.key ? <Ionicons name="checkmark" size={18} color={Colors.primary} /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setFilterOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.filterSection}>Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <Pressable
                onPress={() => setBrand(null)}
                style={[styles.filterChip, !brand && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, !brand && styles.filterChipTextActive]}>All</Text>
              </Pressable>
              {(brandsQuery.data ?? []).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => setBrand(b)}
                  style={[styles.filterChip, brand === b && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, brand === b && styles.filterChipTextActive]}>{b}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.filterSection}>Price range</Text>
            <View style={styles.priceRow}>
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min"
                keyboardType="numeric"
                style={styles.priceInput}
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.priceDash}>-</Text>
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max"
                keyboardType="numeric"
                style={styles.priceInput}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <Text style={styles.filterSection}>Minimum rating</Text>
            <View style={styles.ratingRow}>
              {[null, 3, 4, 4.5].map((r) => (
                <Pressable
                  key={String(r)}
                  onPress={() => setMinRating(r)}
                  style={[styles.filterChip, minRating === r && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, minRating === r && styles.filterChipTextActive]}>
                    {r === null ? 'Any' : `${r}+`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterSection}>Availability</Text>
            <Pressable onPress={() => setInStock(!inStock)} style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>In stock only</Text>
              <Ionicons name={inStock ? 'checkbox' : 'square-outline'} size={20} color={inStock ? Colors.primary : Colors.textMuted} />
            </Pressable>

            <Text style={styles.filterSection}>Discount</Text>
            <Pressable onPress={() => setDiscounted(!discounted)} style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>On sale only</Text>
              <Ionicons name={discounted ? 'checkbox' : 'square-outline'} size={20} color={discounted ? Colors.primary : Colors.textMuted} />
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear all</Text>
              </Pressable>
              <Pressable onPress={() => setFilterOpen(false)} style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  title: { ...Typography.h2, color: Colors.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  catList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  categoryCard: {
    width: 90,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryImage: { width: 48, height: 48, borderRadius: 24, marginBottom: Spacing.xs },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: { ...Typography.small, color: Colors.text, textAlign: 'center', fontWeight: '600' },
  categoryNameActive: { color: '#FFFFFF' },
  subcatList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  subcatChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  subcatChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  subcatText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  subcatTextActive: { color: '#FFFFFF' },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  countText: { ...Typography.caption, color: Colors.textMuted },
  clearText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  grid: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  gridItem: { marginBottom: Spacing.md },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h3, color: Colors.text },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionText: { ...Typography.body, color: Colors.text },
  modalOptionActive: { color: Colors.primary, fontWeight: '600' },
  filterSection: { ...Typography.bodyBold, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  priceInput: {
    flex: 1,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  priceDash: { ...Typography.body, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  toggleLabel: { ...Typography.body, color: Colors.text },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { ...Typography.bodyBold, color: Colors.text },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { ...Typography.bodyBold, color: '#FFFFFF' },
});
