"use client";

import { create } from "zustand";
import { CountryData, PanelState } from "./types";

interface DashboardStore extends PanelState {
  setSelectedCountry: (country: CountryData | null) => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedCountry: null,
  isExpanded: false,
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  reset: () =>
    set({
      selectedCountry: null,
      isExpanded: false,
    }),
}));
