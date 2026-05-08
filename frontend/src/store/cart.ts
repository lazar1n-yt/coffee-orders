import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '@/api/types';

export interface CartItem {
  menuItemId: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: MenuItem) => void;
  remove: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  clear: () => void;
  totalCents: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add(item) {
        const existing = get().items.find((i) => i.menuItemId === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                menuItemId: item.id,
                name: item.name,
                priceCents: item.priceCents,
                imageUrl: item.imageUrl,
                quantity: 1,
              },
            ],
          });
        }
      },
      remove(id) {
        set({ items: get().items.filter((i) => i.menuItemId !== id) });
      },
      setQuantity(id, qty) {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.menuItemId !== id) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menuItemId === id ? { ...i, quantity: qty } : i,
          ),
        });
      },
      clear() {
        set({ items: [] });
      },
      totalCents() {
        return get().items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
      },
      totalCount() {
        return get().items.reduce((s, i) => s + i.quantity, 0);
      },
    }),
    { name: 'coffee.cart' },
  ),
);
