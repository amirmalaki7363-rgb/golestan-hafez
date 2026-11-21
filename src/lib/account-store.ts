"use client";

import { create } from "zustand";

export interface AccountUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface AccountStats {
  orders: number;
  active: number;
  spent: number;
}

export type PanelView = "account" | "admin";

interface AccountState {
  user: AccountUser | null;
  stats: AccountStats | null;
  checked: boolean; // /api/auth/me resolved at least once
  open: boolean;
  view: PanelView;
  setOpen: (open: boolean) => void;
  setView: (view: PanelView) => void;
  refresh: () => Promise<AccountUser | null>;
  logout: () => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  user: null,
  stats: null,
  checked: false,
  open: false,
  view: "account",
  setOpen: (open) => set({ open }),
  setView: (view) => set({ view }),
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      const user: AccountUser | null = data.user ?? null;
      const stats: AccountStats | null = data.stats ?? null;
      set((state) => ({
        user,
        stats,
        checked: true,
        // If logged out while viewing admin, fall back to the account view (auth form renders when user is null).
        view: user ? state.view : "account",
      }));
      return user;
    } catch {
      set({ user: null, stats: null, checked: true, view: "account" });
      return null;
    }
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null, stats: null, view: "account" });
    }
  },
}));
