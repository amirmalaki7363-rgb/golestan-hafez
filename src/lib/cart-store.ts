"use client";

import { create } from "zustand";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
}

export const formatIRT = (price: number) =>
  `${price.toLocaleString("en-US")} IRT`;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  open: false,
  setOpen: (open) => set({ open }),
  addItem: (item) => {
    const existing = get().items.find((i) => i.id === item.id);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        ),
      });
    } else {
      set({ items: [...get().items, { ...item, qty: 1 }] });
    }
    toast({
      title: "به سبد خرید اضافه شد",
      description: `${item.name} — ${formatIRT(item.price)}`,
    });
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  increment: (id) =>
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)),
    }),
  decrement: (id) =>
    set({
      items: get()
        .items.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    }),
  clear: () => set({ items: [] }),
}));
