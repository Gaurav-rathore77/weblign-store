import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import { fetchCart } from '../services/cart';

export function CartSync() {
  const { user } = useAuth();
  const setItems = useCartStore((s) => s.setItems);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetchCart(user.id)
      .then((items) => {
        if (mounted && items.length) setItems(items);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [user, setItems]);

  return null;
}
