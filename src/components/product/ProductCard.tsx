import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Product } from '../../types';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants';
import { formatCurrency } from '../../utils/format';

type ProductCardProps = {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  compact?: boolean;
};

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  compact = false,
}: ProductCardProps) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <Pressable onPress={onPress} style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.imageUrl || 'https://picsum.photos/seed/product/400/400' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        ) : null}
        <Pressable
          onPress={onToggleWishlist}
          hitSlop={8}
          style={styles.wishlistBtn}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? Colors.danger : Colors.textMuted}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={Colors.warning} />
          <Text style={styles.ratingText}>
            {product.rating.toFixed(1)} ({product.reviewCount})
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price, product.currency)}</Text>
          {product.compareAtPrice ? (
            <Text style={styles.comparePrice}>
              {formatCurrency(product.compareAtPrice, product.currency)}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onAddToCart} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          <Text style={styles.cartBtnText}>Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.sm,
    marginRight: Spacing.md,
  },
  cardCompact: { width: 150 },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
  },
  image: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  wishlistBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: Spacing.sm },
  name: { ...Typography.bodyBold, color: Colors.text, fontSize: 13, minHeight: 34 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingText: { fontSize: 11, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  price: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  comparePrice: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  cartBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radii.sm,
    paddingVertical: 6,
  },
  cartBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
