"use client";

import { create } from "zustand";
import { CountryData, PanelState } from "./types";

interface DashboardStore extends PanelState {
  setSelectedCountry: (country: CountryData | null) => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  toggleDisruptionsVisible: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedCountry: null,
  isExpanded: false,
  disruptionsVisible: true,
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
  toggleDisruptionsVisible: () =>
    set((state) => {
      const newVisible = !state.disruptionsVisible;
      console.log(`🔄 STATE: Toggle disruptions = ${newVisible}`);
      return { disruptionsVisible: newVisible };
    }),
  reset: () => {
    console.log("🔄 STATE: Reset panel");
    return set({
      selectedCountry: null,
      isExpanded: false,
    });
  },
}));
