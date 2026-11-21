"use client";

import { create } from "zustand";

/**
 * «همه محصولات» — full-screen catalog page with category filters.
 * Opened from the Best Sellers "View all" link.
 */
interface AllProductsState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useAllProductsStore = create<AllProductsState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
