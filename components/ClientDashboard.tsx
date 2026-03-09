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
    <div className="flex-1 relative overflow-hidden">
      <EnergyMap countries={countries} />
      <EnergyPanel />
    </div>
  );
}
