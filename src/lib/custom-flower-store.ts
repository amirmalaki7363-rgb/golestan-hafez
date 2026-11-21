"use client";

import { create } from "zustand";

/**
 * «گل به سلیقه شما» — full-screen custom flower builder page.
 * The header (desktop & mobile) opens it; the page itself closes it.
 */
interface CustomFlowerState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCustomFlowerStore = create<CustomFlowerState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
