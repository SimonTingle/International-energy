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
  setSelectedCountry: (country) =>
    set({ selectedCountry: country }),
  setIsExpanded: (expanded) =>
    set({ isExpanded: expanded }),
  toggleExpanded: () =>
    set((state) => {
      const newExpanded = !state.isExpanded;
      console.log(`🔄 STATE: Toggle expand = ${newExpanded}`);
      return { isExpanded: newExpanded };
    }),
  reset: () => {
    console.log("🔄 STATE: Reset panel");
    return set({
      selectedCountry: null,
      isExpanded: false,
    });
  },
}));
