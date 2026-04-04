/**
 * /fuel – Live Fuel Tracker Dashboard
 *
 * Real-data-only page. Zero hardcoded numbers.
 * All values fetched at runtime from EIA, OWID, World Bank, maritime RSS feeds.
 */

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

export const revalidate = 1800; // 30 min ISR

// Load heavy components client-side only (they use fetch + state)
const CountryTable = dynamic(() => import('@/components/fuel/CountryTable'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center">
      <div className="inline-flex items-center gap-2 text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
        <span className="text-sm">Loading global fuel data…</span>
      </div>
    </div>
  ),
});

const LiveDisruptions = dynamic(() => import('@/components/fuel/LiveDisruptions'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center">
      <div className="inline-flex items-center gap-2 text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-500 border-t-red-400 rounded-full animate-spin" />
        <span className="text-sm">Loading maritime disruptions…</span>
      </div>
    </div>
  ),
});

const FuelMetricsUS = dynamic(
  async () => {
    const mod = await import('@/components/fuel/FuelMetricsLoader');
    return mod.default;
  },
  { ssr: false }
);

function SourceBadge({ label, url, free }: { label: string; url: string; free?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded-full hover:border-slate-500 transition-colors text-slate-400 hover:text-slate-200"
    >
      {free && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
      {label}
    </a>
  );
}

export default function FuelPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
            ← Dashboard
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-slate-200 font-semibold text-sm">Live Fuel Tracker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Live Fuel Tracker
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Real public data only. Zero mock values. Every number is fetched live from official APIs,
            CSVs, and maritime RSS feeds at runtime. 20-source fallback chain per request.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <SourceBadge label="EIA" url="https://www.eia.gov/opendata/register.php" free />
            <SourceBadge label="OWID" url="https://github.com/owid/energy-data" free />
            <SourceBadge label="World Bank" url="https://data.worldbank.org" free />
            <SourceBadge label="MARAD" url="https://www.maritime.dot.gov/msci/maritime-advisories" free />
            <SourceBadge label="gCaptain RSS" url="https://gcaptain.com" free />
            <SourceBadge label="Nitter RSS" url="https://nitter.privacydev.net/WindwardAI" free />
            <SourceBadge label="MarineTraffic Blog" url="https://www.marinetraffic.com/blog" free />
          </div>
        </div>

        {/* X/Twitter workaround notice */}
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl px-4 py-3 text-sm space-y-1">
          <p className="text-blue-300 font-medium">No Twitter/X API key? No problem.</p>
          <p className="text-slate-400 text-xs">
            Maritime disruption data (including @WindwardAI Gulf shipping alerts) is fetched via
            <strong className="text-slate-300"> Nitter RSS</strong> — public Twitter mirrors that
            require zero API keys. Additional coverage from
            <strong className="text-slate-300"> MARAD official advisories</strong>,
            <strong className="text-slate-300"> gCaptain</strong>, and
            <strong className="text-slate-300"> MarineTraffic</strong> RSS feeds.
            If Nitter instances are down, the other three sources still provide live maritime intelligence.
          </p>
        </div>

        {/* US Metrics strip (loads its own data client-side) */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            US Weekly Inventories & Prices
          </h2>
          <Suspense fallback={<div className="h-32 bg-slate-900/60 rounded-xl animate-pulse" />}>
            <FuelMetricsUS />
          </Suspense>
        </section>

        {/* Two-column layout: disruptions + table */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          {/* Country table */}
          <section className="space-y-2 min-w-0">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Global Reserves & Production
            </h2>
            <CountryTable />
          </section>

          {/* Maritime disruptions */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Maritime Disruptions
            </h2>
            <LiveDisruptions />
          </section>
        </div>

        {/* API endpoints reference */}
        <section className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">API Endpoints</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
            {[
              { path: '/api/global', desc: 'All countries – reserves, production, R/P' },
              { path: '/api/disruptions', desc: 'Live maritime disruptions (Nitter + MARAD + gCaptain)' },
              { path: '/api/fuel/USA', desc: 'US weekly stocks + prices + reserves' },
              { path: '/api/fuel/SAU', desc: 'Saudi Arabia data (ISO-3)' },
              { path: '/api/health', desc: 'Railway health check endpoint' },
            ].map(({ path, desc }) => (
              <div key={path} className="flex gap-2">
                <a
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 whitespace-nowrap transition-colors"
                >
                  GET {path}
                </a>
                <span className="text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pb-4">
          Zero mock data · All sources are public &amp; free ·{' '}
          <a href="https://www.eia.gov/opendata/register.php" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">
            Get free EIA key
          </a>{' '}
          for full live data
        </footer>
      </div>
    </main>
  );
}
