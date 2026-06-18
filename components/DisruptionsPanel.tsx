"use client";

import dynamic from "next/dynamic";
import { useDashboardStore } from "@/lib/store";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";

const LiveDisruptions = dynamic(() => import("@/components/fuel/LiveDisruptions"), {
  loading: () => (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center">
      <div className="inline-flex items-center gap-2 text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-500 border-t-red-400 rounded-full animate-spin" />
        <span className="text-sm">Loading maritime disruptions…</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function DisruptionsPanel() {
  const { disruptionsVisible, toggleDisruptionsVisible } = useDashboardStore();

  if (!disruptionsVisible) {
    return (
      <button
        onClick={toggleDisruptionsVisible}
        className="fixed left-4 top-4 z-[9998] bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
        aria-label="Show disruptions panel"
      >
        <ChevronRightIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Maritime Alerts</span>
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 bottom-0 bg-slate-800 border-r border-slate-700 shadow-2xl transition-all duration-300 flex flex-col z-[9998] pointer-events-auto w-96">
      {/* Header */}
      <div className="bg-slate-900 p-6 border-b border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Maritime Disruptions</h2>
            <p className="text-slate-400 text-xs">Live AIS & RSS feeds</p>
          </div>
          <button
            onClick={toggleDisruptionsVisible}
            className="text-slate-400 hover:text-white transition-colors p-2"
            aria-label="Hide disruptions panel"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <LiveDisruptions />
      </div>
    </div>
  );
}
