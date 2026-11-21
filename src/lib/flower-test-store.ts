"use client";

import { create } from "zustand";

/**
 * «شخصیت‌شناسی گل» — full-screen flower personality test wizard.
 * Opened from the header nav, the homepage teaser and the account panel.
 */
interface FlowerTestState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useFlowerTestStore = create<FlowerTestState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
