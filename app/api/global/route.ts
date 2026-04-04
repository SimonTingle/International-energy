/**
 * GET /api/global
 *
 * Returns aggregated global fuel data for the country table:
 *  - Oil production by country (EIA international or OWID)
 *  - Oil reserves by country (EIA international or OWID/BP)
 *  - R/P ratios calculated on the fly
 *  - Brent crude reference price
 *  - US fuel retail prices (if EIA key available)
 *
 * Sorted by reserves descending by default.
 */

import { fetchIntlOilProduction, fetchIntlOilReserves } from '@/lib/fuel/eia';
import { fetchOWIDProduction, fetchOWIDOilReserves } from '@/lib/fuel/owid';
import { fetchWorldBankBrentCrude } from '@/lib/fuel/prices';

export const revalidate = 3600; // 1 hour

export interface CountryFuelRow {
  id: string;
  name: string;
  reserves_bb: number | null;      // billion barrels
  production_kbd: number | null;   // thousand barrels/day
  rp_ratio: number | null;         // years
  production_source: string;
  reserves_source: string;
  period: string;
}

export async function GET() {
  const [eiaProd, eiaRes, owidProd, owidRes, brent] = await Promise.allSettled([
    fetchIntlOilProduction(),
    fetchIntlOilReserves(),
    fetchOWIDProduction(),
    fetchOWIDOilReserves(),
    fetchWorldBankBrentCrude(),
  ]);

  const countryMap = new Map<string, CountryFuelRow>();

  // Helper to upsert a row
  function upsert(id: string, name: string, updates: Partial<CountryFuelRow>) {
    const existing = countryMap.get(id) ?? {
      id,
      name,
      reserves_bb: null,
      production_kbd: null,
      rp_ratio: null,
      production_source: '',
      reserves_source: '',
      period: '',
    };
    countryMap.set(id, { ...existing, ...updates, id, name: existing.name || name });
  }

  // ── EIA international production ────────────────────────────────────
  if (eiaProd.status === 'fulfilled' && eiaProd.value) {
    for (const c of eiaProd.value.countries) {
      upsert(c.countryId, c.countryName, {
        production_kbd: c.value,
        production_source: eiaProd.value.source,
        period: c.period,
      });
    }
  }

  // ── EIA international reserves ──────────────────────────────────────
  if (eiaRes.status === 'fulfilled' && eiaRes.value) {
    for (const c of eiaRes.value.countries) {
      upsert(c.countryId, c.countryName, {
        reserves_bb: c.value,
        reserves_source: eiaRes.value.source,
      });
    }
  }

  // ── OWID production (fills gaps from EIA) ───────────────────────────
  if (owidProd.status === 'fulfilled' && owidProd.value) {
    for (const c of owidProd.value.countries) {
      const existing = countryMap.get(c.iso3);
      if (!existing?.production_kbd && c.oil_production_twh) {
        // Convert TWh → kbd: 1 TWh ≈ 23,884 barrels of oil equivalent
        const kbd = (c.oil_production_twh * 23884) / 365;
        upsert(c.iso3, c.country, {
          production_kbd: Math.round(kbd),
          production_source: owidProd.value.source,
          period: c.year,
        });
      }
    }
  }

  // ── OWID reserves (fills gaps from EIA) ────────────────────────────
  if (owidRes.status === 'fulfilled' && owidRes.value) {
    for (const c of owidRes.value.countries) {
      const existing = countryMap.get(c.code);
      if (!existing?.reserves_bb) {
        upsert(c.code, c.country, {
          reserves_bb: c.reserves_bb,
          reserves_source: owidRes.value.source,
        });
      }
    }
  }

  // ── Compute R/P ratios ───────────────────────────────────────────────
  for (const [, row] of countryMap) {
    if (row.reserves_bb && row.production_kbd && row.production_kbd > 0) {
      const prodYearBb = (row.production_kbd * 1000 * 365) / 1e9;
      row.rp_ratio = Math.round(row.reserves_bb / prodYearBb);
    }
  }

  // Build sorted array: by reserves desc, then by name
  const countries = Array.from(countryMap.values())
    .filter(c => c.production_kbd || c.reserves_bb)
    .sort((a, b) => {
      const ra = a.reserves_bb ?? 0;
      const rb = b.reserves_bb ?? 0;
      return rb - ra || a.name.localeCompare(b.name);
    });

  const sources = [
    eiaProd.status === 'fulfilled' && eiaProd.value ? eiaProd.value.source : null,
    eiaRes.status === 'fulfilled' && eiaRes.value ? eiaRes.value.source : null,
    owidProd.status === 'fulfilled' && owidProd.value ? owidProd.value.source : null,
    owidRes.status === 'fulfilled' && owidRes.value ? owidRes.value.source : null,
  ].filter(Boolean);

  return Response.json(
    {
      countries,
      brent_crude: brent.status === 'fulfilled' ? brent.value : null,
      fetchedAt: new Date().toISOString(),
      sources,
      count: countries.length,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
  );
}
