"use client";

import { useEffect } from "react";
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

const DisruptionsPanel = dynamic(() => import("@/components/DisruptionsPanel"), {
  ssr: false,
});

export default function ClientDashboard({
  countries,
}: {
  countries: CountryData[];
}) {
  useEffect(() => {
    console.log(
      "%c🌍 DASHBOARD INITIALIZED",
      "color: #0ea5e9; font-weight: bold; font-size: 14px"
    );
    console.log(`📍 Total countries: ${countries.length}`);
    console.table({
      "Map Provider": "OpenStreetMap (Leaflet)",
      "Data Source": "countries-data.json",
      "Initialized At": new Date().toLocaleTimeString(),
      "Browser": navigator.userAgent.split(" ").slice(-2).join(" "),
    });
  }, [countries.length]);
  return (
    <div className="flex-1 relative">
      <div className="absolute inset-0">
        <EnergyMap countries={countries} />
      </div>
      <DisruptionsPanel />
      <EnergyPanel />
    </div>
  );
}
