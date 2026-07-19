import { useCallback, useMemo, useState } from "react";
import type { ClassSlot } from "@/lib/class-interface";

export function useClassCart() {
  const [items, setItems] = useState<ClassSlot[]>([]);

  const cartKeys = useMemo(() => new Set(items.map((slot) => slot.key)), [items]);

  const addToCart = useCallback((slot: ClassSlot): boolean => {
    if (cartKeys.has(slot.key)) return false;
    setItems((prev) => [...prev, slot]);
    return true;
  }, [cartKeys]);

  const removeFromCart = useCallback((key: string) => {
    setItems((prev) => prev.filter((slot) => slot.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const removePaidFromCart = useCallback((keys: string[]) => {
    const keySet = new Set(keys);
    setItems((prev) => prev.filter((slot) => !keySet.has(slot.key)));
  }, []);

  const isInCart = useCallback(
    (key: string) => cartKeys.has(key),
    [cartKeys]
  );

  return {
    cartItems: items,
    cartCount: items.length,
    addToCart,
    removeFromCart,
    clearCart,
    removePaidFromCart,
    isInCart,
  };
}
