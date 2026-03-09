"use client";

import dynamic from "next/dynamic";
import type { CountryData } from "@/lib/types";

const EnergyMap = dynamic(() => import("@/components/EnergyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800">
      <p className="text-slate-400">Loading map...</p>
    </div>
  ),
});

const EnergyPanel = dynamic(() => import("@/components/EnergyPanel"), {
  ssr: false,
});

export default function ClientDashboard({
  countries,
}: {
  countries: CountryData[];
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1">
        <EnergyMap countries={countries} />
      </div>
      <div className="absolute right-0 top-0 bottom-0 pointer-events-auto">
        <EnergyPanel />
      </div>
    </div>
  );
}
