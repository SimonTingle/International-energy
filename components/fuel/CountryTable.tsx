'use client';

import { useState, useEffect, useCallback } from 'react';

interface CountryFuelRow {
  id: string;
  name: string;
  reserves_bb: number | null;
  production_kbd: number | null;
  rp_ratio: number | null;
  production_source: string;
  reserves_source: string;
  period: string;
}

interface GlobalData {
  countries: CountryFuelRow[];
  brent_crude: { value: number; period: string; source: string } | null;
  fetchedAt: string;
  sources: string[];
  count: number;
}

type SortKey = 'name' | 'reserves_bb' | 'production_kbd' | 'rp_ratio';
type SortDir = 'asc' | 'desc';

function fmt(n: number | null, dec = 1): string {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: dec });
}

function RPBadge({ years }: { years: number | null }) {
  if (years == null) return <span className="text-slate-500">—</span>;
  const color =
    years < 10 ? 'text-red-400 bg-red-900/30' :
    years < 30 ? 'text-yellow-400 bg-yellow-900/30' :
    years < 100 ? 'text-green-400 bg-green-900/30' :
    'text-cyan-400 bg-cyan-900/30';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {years}y
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-600">↕</span>;
  return <span className="text-blue-400">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function CountryTable() {
  const [data, setData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('reserves_bb');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/global');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }

  const filtered = (data?.countries ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const pages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const TH = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-200 transition-colors select-none"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon active={sortKey === col} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Global Fuel Reserves & Production
            {data && <span className="ml-2 text-slate-500 font-normal">({data.count} countries)</span>}
          </h2>
          {data?.brent_crude && (
            <p className="text-xs text-slate-400 mt-0.5">
              Brent crude: <span className="text-orange-400 font-semibold">${data.brent_crude.value.toFixed(2)}/bbl</span>
              <span className="text-slate-500 ml-1">({data.brent_crude.period})</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search country…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sources */}
      {data?.sources && data.sources.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-800/30 border-b border-slate-700/20">
          <p className="text-xs text-slate-500">
            Data: {data.sources.join(' · ')}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 border-b border-slate-700/30">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide w-8">#</th>
              <TH label="Country" col="name" />
              <TH label="Reserves (B bbl)" col="reserves_bb" />
              <TH label="Production (kbd)" col="production_kbd" />
              <TH label="R/P Ratio" col="rp_ratio" />
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Period</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-sm">Loading real data…</span>
                  </div>
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={load} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Retry</button>
                </td>
              </tr>
            )}
            {!loading && !error && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  {search ? 'No countries match your search' : 'No data available – add EIA_API_KEY for live data'}
                </td>
              </tr>
            )}
            {!loading && visible.map((row, i) => {
              const rank = page * PAGE_SIZE + i + 1;
              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-3 py-2 text-slate-600 text-xs">{rank}</td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-200">{row.name}</span>
                    <span className="ml-1.5 text-xs text-slate-600">{row.id}</span>
                  </td>
                  <td className="px-3 py-2 text-amber-400 font-mono text-sm">
                    {row.reserves_bb != null ? fmt(row.reserves_bb) : '—'}
                  </td>
                  <td className="px-3 py-2 text-emerald-400 font-mono text-sm">
                    {row.production_kbd != null ? fmt(row.production_kbd, 0) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <RPBadge years={row.rp_ratio} />
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{row.period || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-4 py-2 border-t border-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      {data?.fetchedAt && (
        <div className="px-4 py-2 border-t border-slate-700/20">
          <p className="text-xs text-slate-600">
            Fetched {new Date(data.fetchedAt).toLocaleString()} · Zero mock data — all values from EIA, OWID, World Bank
          </p>
        </div>
      )}
    </div>
  );
}
