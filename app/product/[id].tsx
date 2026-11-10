import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Screen } from '../../src/components';
import { Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { ProductCard } from '../../src/components/product';
import { useAuth } from '../../src/hooks/useAuth';
import { useCartStore } from '../../src/stores';
import {
  addProductReview,
  addToWishlist,
  checkDeliveryZone,
  fetchProductById,
  fetchProductReviews,
  fetchRelatedProducts,
  fetchWishlistIds,
  recordRecentlyViewed,
  removeFromWishlist,
} from '../../src/services/products';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../src/constants';
import { formatCurrency } from '../../src/utils/format';

const SCREEN_WIDTH = Dimensions.get('window').width;

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i;
    const half = !filled && rating >= i - 0.5;
    stars.push(
      <Ionicons
        key={i}
        name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
        size={size}
        color={Colors.warning}
      />,
    );
  }
  return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
  });

  const reviewsQuery = useQuery({
    queryKey: ['productReviews', id],
    queryFn: () => fetchProductReviews(id as string),
    enabled: !!id,
  });

  const product = productQuery.data;

  const relatedQuery = useQuery({
    queryKey: ['relatedProducts', id, product?.categoryId],
    queryFn: () => fetchRelatedProducts(id as string, product?.categoryId ?? null),
    enabled: !!product,
  });

  const wishlistQuery = useQuery({
    queryKey: ['wishlistIds', user?.id],
    queryFn: () => (user ? fetchWishlistIds(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && id) {
      recordRecentlyViewed(user.id, id as string).catch(() => {});
    }
  }, [user, id]);

  const isWishlisted = (wishlistQuery.data ?? []).includes(id as string);

  const images = useMemo(() => {
    if (!product) return [];
    const list = [product.imageUrl, ...(product.images ?? [])].filter(Boolean) as string[];
    return list.length ? list : ['https://picsum.photos/seed/product/600/600'];
  }, [product]);

  const discount = useMemo(() => {
    if (!product?.compareAtPrice || product.compareAtPrice <= product.price) return 0;
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }, [product]);

  const toggleWishlist = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (isWishlisted) {
      await removeFromWishlist(user.id, id as string);
    } else {
      await addToWishlist(user.id, id as string);
    }
    queryClient.invalidateQueries({ queryKey: ['wishlistIds', user.id] });
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) return;
    addItem(product, quantity);
    Alert.alert('Added to cart', `${product.name} x${quantity} added to your cart.`);
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    addItem(product, quantity);
    router.push('/(tabs)/cart');
  };

  const handleCheckDelivery = async () => {
    if (!/^\d{6}$/.test(pinCode)) {
      Alert.alert('Invalid PIN', 'Enter a valid 6-digit PIN code.');
      return;
    }
    setCheckingDelivery(true);
    try {
      const zone = await checkDeliveryZone(pinCode);
      setDeliveryInfo(zone);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not check delivery.');
    } finally {
      setCheckingDelivery(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!product) return;
    setSubmittingReview(true);
    try {
      await addProductReview(product.id, user.id, reviewRating, reviewTitle, reviewComment);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['productReviews', id] });
      Alert.alert('Thank you', 'Your review has been submitted.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        title: product.name,
        message: `Check out ${product.name} on Weblign Store: ${formatCurrency(product.price, product.currency)}`,
      });
    } catch {}
  };

  const estimatedDeliveryDate = useMemo(() => {
    if (!deliveryInfo?.serviceable) return null;
    const d = new Date();
    d.setDate(d.getDate() + (deliveryInfo.estimatedDays ?? 4));
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }, [deliveryInfo]);

  if (productQuery.isLoading) return <Loading message="Loading product..." />;
  if (productQuery.isError || !product) {
    return (
      <Screen>
        <ErrorState message="Product not found." onRetry={() => productQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.galleryWrap}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Pressable onPress={toggleWishlist} style={styles.wishBtn}>
            <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? Colors.danger : Colors.text} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.text} />
          </Pressable>

          <FlatList
            data={images}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(i);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} contentFit="cover" />
            )}
          />
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={product.rating} />
            <Text style={styles.ratingText}>
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(product.price, product.currency)}</Text>
            {product.compareAtPrice ? (
              <Text style={styles.comparePrice}>{formatCurrency(product.compareAtPrice, product.currency)}</Text>
            ) : null}
            {discount > 0 ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}% OFF</Text>
              </View>
            ) : null}
          </View>

          {product.sizes && product.sizes.length > 0 ? (
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Size</Text>
              <View style={styles.chipRow}>
                {product.sizes.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSelectedSize(s)}
                    style={[styles.chip, selectedSize === s && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedSize === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {product.colors && product.colors.length > 0 ? (
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Color</Text>
              <View style={styles.chipRow}>
                {product.colors.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[styles.chip, selectedColor === c && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedColor === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.optionSection}>
            <Text style={styles.optionLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
                <Ionicons name="remove" size={18} color={Colors.text} />
              </Pressable>
              <Text style={styles.qtyText}>{quantity}</Text>
              <Pressable onPress={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))} style={styles.qtyBtn}>
                <Ionicons name="add" size={18} color={Colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.stockRow}>
            <Ionicons
              name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={product.stock > 0 ? Colors.success : Colors.danger}
            />
            <Text style={styles.stockText}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="Add to Cart"
              onPress={handleAddToCart}
              disabled={product.stock <= 0}
              fullWidth
            />
          </View>
          <Button
            label="Buy Now"
            variant="secondary"
            onPress={handleBuyNow}
            disabled={product.stock <= 0}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />

          <View style={styles.deliveryCard}>
            <Text style={styles.deliveryTitle}>Delivery options</Text>
            <View style={styles.pinRow}>
              <TextInput
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="Enter PIN code"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.pinInput}
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable onPress={handleCheckDelivery} style={styles.pinBtn} disabled={checkingDelivery}>
                <Text style={styles.pinBtnText}>{checkingDelivery ? 'Checking...' : 'Check'}</Text>
              </Pressable>
            </View>
            {deliveryInfo ? (
              deliveryInfo.serviceable ? (
                <View style={styles.deliveryResult}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.deliveryText}>
                    Delivery available to {deliveryInfo.city ?? pinCode}. Estimated by {estimatedDeliveryDate}.
                  </Text>
                </View>
              ) : (
                <View style={styles.deliveryResult}>
                  <Ionicons name="close-circle" size={16} color={Colors.danger} />
                  <Text style={styles.deliveryText}>Delivery not available to this PIN code.</Text>
                </View>
              )
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description || 'No description available.'}</Text>
          </View>

          {product.specifications && product.specifications.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {product.specifications.map((spec, i) => (
                <View key={i} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {reviewsQuery.isLoading ? (
              <Loading />
            ) : (reviewsQuery.data ?? []).length === 0 ? (
              <EmptyState title="No reviews yet" description="Be the first to review this product." />
            ) : (
              (reviewsQuery.data ?? []).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <StarRating rating={r.rating} size={12} />
                    <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))
            )}

            {user ? (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormTitle}>Write a review</Text>
                <View style={styles.starPicker}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Pressable key={s} onPress={() => setReviewRating(s)}>
                      <Ionicons
                        name={s <= reviewRating ? 'star' : 'star-outline'}
                        size={24}
                        color={Colors.warning}
                      />
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={reviewTitle}
                  onChangeText={setReviewTitle}
                  placeholder="Review title"
                  style={styles.reviewInput}
                  placeholderTextColor={Colors.textMuted}
                />
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your experience"
                  style={[styles.reviewInput, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  placeholderTextColor={Colors.textMuted}
                />
                <Button
                  label="Submit Review"
                  onPress={handleSubmitReview}
                  loading={submittingReview}
                  fullWidth
                  style={{ marginTop: Spacing.sm }}
                />
              </View>
            ) : (
              <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: Spacing.md }}>
                <Text style={styles.linkText}>Sign in to write a review</Text>
              </Pressable>
            )}
          </View>

          {relatedQuery.data && relatedQuery.data.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related Products</Text>
              <FlatList
                horizontal
                data={relatedQuery.data}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={() => router.push(`/product/${item.id}`)}
                    onAddToCart={() => addItem(item)}
                    compact
                  />
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ) : null}

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  galleryWrap: { position: 'relative', backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: 64,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImage: { width: SCREEN_WIDTH, aspectRatio: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 18, backgroundColor: Colors.primary },
  body: { padding: Spacing.lg },
  brand: { ...Typography.caption, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  name: { ...Typography.h2, color: Colors.text, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.sm },
  ratingText: { ...Typography.caption, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  price: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  comparePrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: Colors.danger, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radii.sm },
  discountText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  optionSection: { marginTop: Spacing.lg },
  optionLabel: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 18, fontWeight: '700', color: Colors.text, minWidth: 32, textAlign: 'center' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  stockText: { ...Typography.caption, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  deliveryCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    ...Shadows.sm,
  },
  deliveryTitle: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.md },
  pinRow: { flexDirection: 'row', gap: Spacing.sm },
  pinInput: {
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
  pinBtn: {
    paddingHorizontal: Spacing.lg,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBtnText: { color: '#FFFFFF', fontWeight: '600' },
  deliveryResult: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  deliveryText: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  section: { marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  description: { ...Typography.body, color: Colors.textMuted, lineHeight: 24 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: { ...Typography.body, color: Colors.textMuted, flex: 1 },
  specValue: { ...Typography.bodyBold, color: Colors.text, flex: 1, textAlign: 'right' },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate: { ...Typography.small, color: Colors.textMuted },
  reviewTitle: { ...Typography.bodyBold, color: Colors.text, marginTop: Spacing.xs },
  reviewComment: { ...Typography.body, color: Colors.textMuted, marginTop: 4 },
  reviewForm: { marginTop: Spacing.lg },
  reviewFormTitle: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  starPicker: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  reviewInput: {
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  linkText: { color: Colors.primary, fontWeight: '600' },
});
