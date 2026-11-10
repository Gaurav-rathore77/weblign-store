import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Banner } from '../../types';
import { Colors, Radii, Spacing, Typography } from '../../constants';

const { width } = Dimensions.get('window');

type BannerCarouselProps = {
  banners: Banner[];
  onPressBanner?: (banner: Banner) => void;
};

export function BannerCarousel({ banners, onPressBanner }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Banner>>(null);

  if (!banners.length) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (width - Spacing.lg * 2));
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPressBanner?.(item)} style={styles.slide}>
            <Image
              source={{ uri: item.imageUrl || 'https://picsum.photos/seed/banner/800/300' }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.overlay}>
              {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            </View>
          </Pressable>
        )}
      />
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const CARD_WIDTH = width - Spacing.lg * 2;

const styles = StyleSheet.create({
  wrap: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  slide: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: Spacing.lg,
    right: Spacing.lg,
  },
  title: { ...Typography.h3, color: '#FFFFFF' },
  subtitle: { ...Typography.body, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});
