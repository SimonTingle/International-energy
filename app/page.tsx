import { Suspense } from "react";
import EnergyMap from "@/components/EnergyMap";
import EnergyPanel from "@/components/EnergyPanel";
import { loadCountriesData } from "@/lib/data-loader";

export const revalidate = 3600; // Revalidate every hour

async function DashboardContent() {
  const countries = await loadCountriesData();

  return (
    <div className="w-full h-screen flex flex-col bg-energy-dark">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-8 py-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white">
          Global Energy Resources Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Interactive map showing live energy resources per country
        </p>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <EnergyMap countries={countries} />
        <EnergyPanel />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 px-8 py-4 text-center text-slate-400 text-sm">
        <p>Data updated regularly • Last sync: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-energy-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-energy-blue mx-auto mb-4"></div>
            <p className="text-slate-400">Loading energy resources...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
