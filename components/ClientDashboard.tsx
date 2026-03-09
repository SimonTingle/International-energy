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
    <div className="flex-1 flex relative">
      <div className="flex-1 overflow-hidden">
        <EnergyMap countries={countries} />
      </div>
      <div className="absolute right-0 top-0 bottom-0 pointer-events-auto z-50">
        <EnergyPanel />
      </div>
    </div>
  );
}
