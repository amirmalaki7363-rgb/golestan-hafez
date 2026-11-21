"use client";

import { create } from "zustand";

/**
 * Storefront category filter — shared between the header menu (writer)
 * and the products carousel (reader).
 */
interface CategoryFilterState {
  category: string | null;
  setCategory: (category: string | null) => void;
}

export const useCategoryFilterStore = create<CategoryFilterState>((set) => ({
  category: null,
  setCategory: (category) => set({ category }),
}));
