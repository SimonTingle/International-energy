/**
 * GET /api/fuel/[country]
 *
 * Returns live fuel metrics for a given country (ISO-3 or ISO-2 code or name).
 * Runs the 20-source fallback chain and includes live maritime disruptions.
 *
 * All data is from real public APIs – zero mocked values.
 */

import { NextRequest } from 'next/server';
import {
  fetchUSCrudeStocks,
  fetchUSGasolineStocks,
  fetchUSDistillateStocks,
  fetchUSGasolinePrice,
  fetchUSDieselPrice,
  fetchUSCrudeReserves,
  fetchUSCrudeProduction,
  fetchIntlOilProduction,
  fetchIntlOilReserves,
} from '@/lib/fuel/eia';
import { fetchOWIDCountry, fetchOWIDOilReserves } from '@/lib/fuel/owid';
import { fetchWorldBankBrentCrude } from '@/lib/fuel/prices';
import { fetchAllDisruptions } from '@/lib/fuel/maritime';

export const revalidate = 1800; // 30 min

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params;
  const code = country.toUpperCase();
  const isUS = ['US', 'USA', 'UNITED-STATES', 'UNITED_STATES'].includes(code);

  const fetchedAt = new Date().toISOString();
  const sources: string[] = [];
  const payload: Record<string, unknown> = {
    country: code,
    fetchedAt,
    sources,
  };

  // ── US-specific live data ──────────────────────────────────────────────
  if (isUS) {
    const [crude, gasoline, distillate, gasPrice, dieselPrice, reserves, production] =
      await Promise.allSettled([
        fetchUSCrudeStocks(),
        fetchUSGasolineStocks(),
        fetchUSDistillateStocks(),
        fetchUSGasolinePrice(),
        fetchUSDieselPrice(),
        fetchUSCrudeReserves(),
        fetchUSCrudeProduction(),
      ]);

    if (crude.status === 'fulfilled' && crude.value) {
      payload.crude_stocks = crude.value;
      sources.push(crude.value.source);
    }
    if (gasoline.status === 'fulfilled' && gasoline.value) {
      payload.gasoline_stocks = gasoline.value;
      sources.push(gasoline.value.source);
    }
    if (distillate.status === 'fulfilled' && distillate.value) {
      payload.distillate_stocks = distillate.value;
      sources.push(distillate.value.source);
    }
    if (gasPrice.status === 'fulfilled' && gasPrice.value) {
      payload.gasoline_price = gasPrice.value;
      sources.push(gasPrice.value.source);
    }
    if (dieselPrice.status === 'fulfilled' && dieselPrice.value) {
      payload.diesel_price = dieselPrice.value;
      sources.push(dieselPrice.value.source);
    }
    if (reserves.status === 'fulfilled' && reserves.value) {
      payload.crude_reserves = reserves.value;
      sources.push(reserves.value.source);
    }
    if (production.status === 'fulfilled' && production.value) {
      payload.crude_production = production.value;
      sources.push(production.value.source);
    }
  }

  // ── International production & reserves (EIA intl) ───────────────────
  const [intlProd, intlRes] = await Promise.allSettled([
    fetchIntlOilProduction(),
    fetchIntlOilReserves(),
  ]);

  if (intlProd.status === 'fulfilled' && intlProd.value) {
    const row = intlProd.value.countries.find(c =>
      c.countryId === code || c.countryName?.toUpperCase().includes(code)
    );
    if (row) {
      payload.intl_production = { ...row, unit: intlProd.value.unit, source: intlProd.value.source };
      sources.push(intlProd.value.source);
    }
  }
  if (intlRes.status === 'fulfilled' && intlRes.value) {
    const row = intlRes.value.countries.find(c =>
      c.countryId === code || c.countryName?.toUpperCase().includes(code)
    );
    if (row) {
      payload.intl_reserves = { ...row, unit: intlRes.value.unit, source: intlRes.value.source };
      sources.push(intlRes.value.source);
    }
  }

  // ── OWID production & reserves ────────────────────────────────────────
  const [owidProd, owidReserves] = await Promise.allSettled([
    fetchOWIDCountry(code),
    fetchOWIDOilReserves(),
  ]);
  if (owidProd.status === 'fulfilled' && owidProd.value) {
    payload.owid_production = owidProd.value;
    sources.push(owidProd.value.source);
  }
  if (owidReserves.status === 'fulfilled' && owidReserves.value) {
    const row = owidReserves.value.countries.find(c => c.code === code);
    if (row) {
      payload.owid_reserves = { ...row, unit: owidReserves.value.unit, source: owidReserves.value.source };
      sources.push(owidReserves.value.source);
    }
  }

  // ── Brent crude reference price ───────────────────────────────────────
  const brent = await fetchWorldBankBrentCrude();
  if (brent) {
    payload.brent_crude = brent;
    sources.push(brent.source);
  }

  // ── R/P ratio calculation ──────────────────────────────────────────────
  const reservesBb =
    (payload.intl_reserves as { value?: number } | undefined)?.value ??
    (payload.owid_reserves as { reserves_bb?: number } | undefined)?.reserves_bb;
  const prodKbd =
    (payload.intl_production as { value?: number } | undefined)?.value ??
    (payload.owid_production as { oil_production_twh?: number } | undefined)?.oil_production_twh;

  if (reservesBb && prodKbd && prodKbd > 0) {
    // reserves in billion barrels, production in kbd → convert to bbl/yr
    const prodYearBb = prodKbd * 1000 * 365 / 1e9;
    payload.rp_ratio_years = Math.round(reservesBb / prodYearBb);
    payload.rp_source = 'Calculated from EIA/OWID reserves ÷ production';
  }

  // ── Live maritime disruptions (always fetched) ────────────────────────
  const disruptions = await fetchAllDisruptions();
  payload.disruptions = disruptions;
  if (disruptions.sources.length > 0) {
    sources.push(...disruptions.sources);
  }

  if (sources.length === 0) {
    payload.status = 'no_live_data';
    payload.message = 'Add EIA_API_KEY to .env for live US + international data';
  }

  return Response.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
  });
}
