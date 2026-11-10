import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { Screen } from '../../src/components';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { ProductCard } from '../../src/components/product';
import { useAuth } from '../../src/hooks/useAuth';
import { useCartStore } from '../../src/stores';
import {
  clearRecentSearches,
  fetchPopularSearches,
  fetchRecentSearches,
  fetchSearchSuggestions,
  saveRecentSearch,
  searchProducts,
} from '../../src/services/search';
import { fetchBrands, fetchCategories } from '../../src/services/products';
import { Colors, Radii, Spacing, Typography } from '../../src/constants';

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Customer Rating' },
];

const PAGE_SIZE = 20;

export default function SearchScreen() {
  const { user } = useAuth();
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating'>('relevance');
  const [brand, setBrand] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStock, setInStock] = useState(false);
  const [discounted, setDiscounted] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const hasQuery = debouncedQuery.trim().length > 0;

  const recentQuery = useQuery({
    queryKey: ['recentSearches', user?.id],
    queryFn: () => fetchRecentSearches(user?.id),
  });

  const popularQuery = useQuery({
    queryKey: ['popularSearches'],
    queryFn: fetchPopularSearches,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['searchSuggestions', debouncedQuery],
    queryFn: () => fetchSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const brandsQuery = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const filters = useMemo(
    () => ({
      brand,
      categoryId,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      minRating,
      inStock,
      discounted,
      sortBy,
    }),
    [brand, categoryId, minPrice, maxPrice, minRating, inStock, discounted, sortBy],
  );

  const resultsQuery = useInfiniteQuery({
    queryKey: ['searchResults', debouncedQuery, filters],
    queryFn: ({ pageParam = 0 }) =>
      searchProducts({ query: debouncedQuery, ...filters, page: pageParam as number, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.products.length === PAGE_SIZE ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: hasQuery,
  });

  // Save recent search when a query is performed
  useEffect(() => {
    if (hasQuery) {
      saveRecentSearch(debouncedQuery, user?.id).catch(() => {});
    }
  }, [debouncedQuery, hasQuery, user?.id]);

  const products = resultsQuery.data?.pages.flatMap((p) => p.products) ?? [];
  const totalCount = resultsQuery.data?.pages[0]?.count ?? 0;

  const activeFilterCount =
    (brand ? 1 : 0) + (categoryId ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minRating ? 1 : 0) + (inStock ? 1 : 0) + (discounted ? 1 : 0);

  const clearFilters = () => {
    setBrand(null);
    setCategoryId(null);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(null);
    setInStock(false);
    setDiscounted(false);
  };

  const handleSuggestionPress = (text: string) => {
    setQuery(text);
    setDebouncedQuery(text);
  };

  const handleRecentPress = (text: string) => {
    setQuery(text);
    setDebouncedQuery(text);
  };

  const handleClearHistory = async () => {
    await clearRecentSearches(user?.id);
    recentQuery.refetch();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, brands, categories"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => { setQuery(''); setDebouncedQuery(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!hasQuery ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Recent searches */}
          {(recentQuery.data ?? []).length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={handleClearHistory}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.chipWrap}>
                {(recentQuery.data ?? []).map((s) => (
                  <Pressable key={s} onPress={() => handleRecentPress(s)} style={styles.historyChip}>
                    <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.historyChipText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Popular searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.chipWrap}>
              {(popularQuery.data ?? []).map((s) => (
                <Pressable key={s} onPress={() => handleRecentPress(s)} style={styles.popularChip}>
                  <Text style={styles.popularChipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Suggestions while typing? none when empty */}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Suggestions */}
          {suggestionsQuery.data && suggestionsQuery.data.length > 0 && query.length >= 2 && !resultsQuery.isFetching ? (
            <View style={styles.suggestions}>
              {suggestionsQuery.data.map((s, i) => (
                <Pressable key={`${s.type}-${s.text}-${i}`} onPress={() => handleSuggestionPress(s.text)} style={styles.suggestionRow}>
                  <Ionicons
                    name={s.type === 'category' ? 'grid-outline' : s.type === 'brand' ? 'pricetag-outline' : 'search-outline'}
                    size={16}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.suggestionText}>{s.text}</Text>
                  <Text style={styles.suggestionType}>{s.type}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {resultsQuery.isLoading ? 'Searching...' : `${totalCount} result${totalCount !== 1 ? 's' : ''} for "${debouncedQuery}"`}
            </Text>
            <View style={styles.headerActions}>
              <Pressable onPress={() => setSortOpen(true)} style={styles.actionBtn}>
                <Ionicons name="swap-vertical" size={16} color={Colors.text} />
                <Text style={styles.actionText}>Sort</Text>
              </Pressable>
              <Pressable onPress={() => setFilterOpen(true)} style={styles.actionBtn}>
                <Ionicons name="filter" size={16} color={Colors.text} />
                <Text style={styles.actionText}>Filter</Text>
                {activeFilterCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>

          {resultsQuery.isLoading ? (
            <Loading />
          ) : resultsQuery.isError ? (
            <ErrorState message="Search failed." onRetry={() => resultsQuery.refetch()} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No results found"
              description={`We couldn't find anything for "${debouncedQuery}". Try different keywords.`}
            />
          ) : (
            <FlatList
              data={products}
              keyExtractor={(p, idx) => `${p.id}-${idx}`}
              numColumns={2}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              onEndReached={() => {
                if (resultsQuery.hasNextPage && !resultsQuery.isFetchingNextPage) {
                  resultsQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={resultsQuery.isFetchingNextPage ? <Loading /> : undefined}
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
        </View>
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
                  setSortBy(opt.key as any);
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

            <Text style={styles.filterSection}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <Pressable onPress={() => setCategoryId(null)} style={[styles.filterChip, !categoryId && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, !categoryId && styles.filterChipTextActive]}>All</Text>
              </Pressable>
              {(categoriesQuery.data ?? []).map((c: any) => (
                <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.filterChip, categoryId === c.id && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, categoryId === c.id && styles.filterChipTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.filterSection}>Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <Pressable onPress={() => setBrand(null)} style={[styles.filterChip, !brand && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, !brand && styles.filterChipTextActive]}>All</Text>
              </Pressable>
              {(brandsQuery.data ?? []).map((b: string) => (
                <Pressable key={b} onPress={() => setBrand(b)} style={[styles.filterChip, brand === b && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, brand === b && styles.filterChipTextActive]}>{b}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.filterSection}>Price range</Text>
            <View style={styles.priceRow}>
              <TextInput value={minPrice} onChangeText={setMinPrice} placeholder="Min" keyboardType="numeric" style={styles.priceInput} placeholderTextColor={Colors.textMuted} />
              <Text style={styles.priceDash}>-</Text>
              <TextInput value={maxPrice} onChangeText={setMaxPrice} placeholder="Max" keyboardType="numeric" style={styles.priceInput} placeholderTextColor={Colors.textMuted} />
            </View>

            <Text style={styles.filterSection}>Minimum rating</Text>
            <View style={styles.ratingRow}>
              {[null, 3, 4, 4.5].map((r) => (
                <Pressable key={String(r)} onPress={() => setMinRating(r)} style={[styles.filterChip, minRating === r && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, minRating === r && styles.filterChipTextActive]}>{r === null ? 'Any' : `${r}+`}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 44, borderRadius: 22, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  clearText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  historyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  historyChipText: { ...Typography.caption, color: Colors.text },
  popularChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.full, backgroundColor: Colors.primary, marginRight: Spacing.sm, marginBottom: Spacing.sm },
  popularChipText: { ...Typography.caption, color: '#FFFFFF', fontWeight: '600' },
  suggestions: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: Radii.md, marginBottom: Spacing.sm },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionText: { ...Typography.body, color: Colors.text, flex: 1 },
  suggestionType: { ...Typography.small, color: Colors.textMuted, textTransform: 'capitalize' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  resultsCount: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  actionText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  filterBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  grid: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  gridItem: { marginBottom: Spacing.md },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h3, color: Colors.text },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalOptionText: { ...Typography.body, color: Colors.text },
  modalOptionActive: { color: Colors.primary, fontWeight: '600' },
  filterSection: { ...Typography.bodyBold, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm, marginBottom: Spacing.sm },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  priceInput: { flex: 1, height: 44, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, fontSize: 15, color: Colors.text },
  priceDash: { ...Typography.body, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  toggleLabel: { ...Typography.body, color: Colors.text },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  clearBtn: { flex: 1, height: 48, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { ...Typography.bodyBold, color: Colors.text },
  applyBtn: { flex: 1, height: 48, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { ...Typography.bodyBold, color: '#FFFFFF' },
});
