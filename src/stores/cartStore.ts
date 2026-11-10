import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { upsertCartItem, removeCartItem, clearCartRemote } from '../services/cart';
import type { CartItem, Coupon, Product } from '../types';

type CartState = {
  items: CartItem[];
  coupon: Coupon | null;
  addItem: (product: Product, quantity?: number, size?: string | null, color?: string | null) => Promise<void>;
  removeItem: (productId: string, size?: string | null, color?: string | null) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string | null, color?: string | null) => Promise<void>;
  clear: () => Promise<void>;
  setCoupon: (coupon: Coupon | null) => void;
  setItems: (items: CartItem[]) => void;
  totalItems: () => number;
  subtotal: () => number;
  discountAmount: () => number;
  deliveryCharge: () => number;
  total: () => number;
};

const DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 49;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: async (product, quantity = 1, size = null, color = null) => {
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === product.id && (i.size ?? null) === (size ?? null) && (i.color ?? null) === (color ?? null),
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
            return { items: next };
          }
          return { items: [...state.items, { productId: product.id, product, quantity, size, color }] };
        });

        try {
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          if (userId) {
            const item = get().items.find(
              (i) => i.productId === product.id && (i.size ?? null) === (size ?? null) && (i.color ?? null) === (color ?? null),
            );
            await upsertCartItem(userId, product.id, item?.quantity ?? quantity, size, color);
          }
        } catch {}
      },

      removeItem: async (productId, size = null, color = null) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && (i.size ?? null) === (size ?? null) && (i.color ?? null) === (color ?? null)),
          ),
        }));
        try {
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          if (userId) await removeCartItem(userId, productId, size, color);
        } catch {}
      },

      updateQuantity: async (productId, quantity, size = null, color = null) => {
        if (quantity <= 0) {
          await get().removeItem(productId, size, color);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && (i.size ?? null) === (size ?? null) && (i.color ?? null) === (color ?? null)
              ? { ...i, quantity }
              : i,
          ),
        }));
        try {
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          if (userId) await upsertCartItem(userId, productId, quantity, size, color);
        } catch {}
      },

      clear: async () => {
        set({ items: [], coupon: null });
        try {
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          if (userId) await clearCartRemote(userId);
        } catch {}
      },

      setCoupon: (coupon) => set({ coupon }),
      setItems: (items) => set({ items }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      discountAmount: () => {
        const { coupon, items } = get();
        const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        // product-level discounts (compare at price) are informational; coupon applies to subtotal
        if (!coupon) return 0;
        if (coupon.discountType === 'percent') return (subtotal * coupon.discountValue) / 100;
        return Math.min(coupon.discountValue, subtotal);
      },

      deliveryCharge: () => {
        const subtotal = get().subtotal();
        if (subtotal === 0) return 0;
        return subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },

      total: () => {
        const subtotal = get().subtotal();
        return Math.max(0, subtotal - get().discountAmount() + get().deliveryCharge());
      },
    }),
    {
      name: 'weblign-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    },
  ),
);
