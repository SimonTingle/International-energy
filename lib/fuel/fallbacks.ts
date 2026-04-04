/**
 * 20-source fallback chain for fuel data
 *
 * Sources tried in order, stopping at first successful real result.
 * If all fail → returns a "no_live_data" response with timestamps.
 *
 * Free sources used:
 *  1-5:   EIA (free key from eia.gov/opendata/register.php)
 *  6-8:   OWID (Our World in Data) – completely free, no key
 *  9-10:  World Bank – completely free, no key
 *  11:    Carbon Intensity API (UK only) – completely free, no key
 *  12-13: Global Petrol Prices (public scrape)
 *  14-15: IEA public Oil Market Report summary page
 *  16-18: Nitter RSS (Twitter mirror – no key needed)
 *  19:    MARAD official maritime advisories
 *  20:    gCaptain RSS
 */

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
} from './eia';
import { fetchOWIDProduction, fetchOWIDOilReserves } from './owid';
import { fetchWorldBankBrentCrude, fetchGlobalPetrolPrices } from './prices';
import {
  fetchNitterDisruptions,
  fetchMARADAdvisories,
  fetchGCaptainRSS,
} from './maritime';

export type FallbackResult = {
  success: true;
  fallbackIndex: number;
  fallbackName: string;
  data: Record<string, unknown>;
} | {
  success: false;
  message: string;
  lastKnown: string;
  fetchedAt: string;
};

type Fallback = {
  name: string;
  fn: () => Promise<unknown>;
};

export const FALLBACKS: Fallback[] = [
  // 1 – EIA US crude weekly stocks
  { name: 'EIA US Crude Weekly Stocks', fn: fetchUSCrudeStocks },
  // 2 – EIA US gasoline stocks
  { name: 'EIA US Gasoline Stocks', fn: fetchUSGasolineStocks },
  // 3 – EIA US distillate stocks
  { name: 'EIA US Distillate Stocks', fn: fetchUSDistillateStocks },
  // 4 – EIA US gasoline retail price
  { name: 'EIA US Gasoline Price', fn: fetchUSGasolinePrice },
  // 5 – EIA US diesel price
  { name: 'EIA US Diesel Price', fn: fetchUSDieselPrice },
  // 6 – EIA US crude reserves
  { name: 'EIA US Crude Reserves', fn: fetchUSCrudeReserves },
  // 7 – EIA US crude production
  { name: 'EIA US Crude Production', fn: fetchUSCrudeProduction },
  // 8 – EIA International oil production
  { name: 'EIA International Oil Production', fn: fetchIntlOilProduction },
  // 9 – EIA International oil reserves
  { name: 'EIA International Oil Reserves', fn: fetchIntlOilReserves },
  // 10 – OWID energy production CSV
  { name: 'OWID Energy Production CSV', fn: fetchOWIDProduction },
  // 11 – OWID oil reserves (BP Statistical Review)
  { name: 'OWID Oil Reserves CSV', fn: fetchOWIDOilReserves },
  // 12 – World Bank Brent crude price
  { name: 'World Bank Brent Crude Price', fn: fetchWorldBankBrentCrude },
  // 13 – Global Petrol Prices (scrape)
  { name: 'GlobalPetrolPrices.com Scrape', fn: async () => {
    const prices = await fetchGlobalPetrolPrices();
    return prices.length > 0 ? { prices } : null;
  }},
  // 14 – IEA Oil Market Report page (public summary)
  { name: 'IEA Oil Market Report (public summary)', fn: async () => {
    const res = await fetch('https://www.iea.org/reports/oil-market-report', {
      next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/Global\s+oil\s+demand[^<]{0,200}/i);
    return m ? { summary: m[0].trim(), source: 'IEA Oil Market Report', sourceUrl: 'https://www.iea.org/reports/oil-market-report' } : null;
  }},
  // 15 – EIA Short-Term Energy Outlook (public JSON)
  { name: 'EIA Short-Term Energy Outlook', fn: async () => {
    const res = await fetch(
      'https://www.eia.gov/outlooks/steo/json/STEO.json',
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const row = json?.data?.find?.((d: { tableId?: string }) => d.tableId === 'T01');
    return row ? { steo: row, source: 'EIA Short-Term Energy Outlook' } : null;
  }},
  // 16 – Nitter RSS @WindwardAI
  { name: 'Nitter RSS @WindwardAI', fn: async () => {
    const posts = await fetchNitterDisruptions();
    return posts.length > 0 ? { posts, source: 'Nitter/@WindwardAI' } : null;
  }},
  // 17 – MARAD maritime advisories
  { name: 'MARAD Maritime Advisories', fn: async () => {
    const posts = await fetchMARADAdvisories();
    return posts.length > 0 ? { posts, source: 'MARAD' } : null;
  }},
  // 18 – gCaptain RSS
  { name: 'gCaptain RSS', fn: async () => {
    const posts = await fetchGCaptainRSS();
    return posts.length > 0 ? { posts, source: 'gCaptain' } : null;
  }},
  // 19 – EIA Weekly Petroleum Status Report (public HTML)
  { name: 'EIA Weekly Petroleum Status Report', fn: async () => {
    const res = await fetch('https://www.eia.gov/petroleum/supply/weekly/', {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/Commercial\s+crude\s+oil\s+inventories[^<]{0,500}/i);
    return m ? { summary: m[0].trim(), source: 'EIA Weekly Petroleum Status Report' } : null;
  }},
  // 20 – World Bank energy data fallback
  { name: 'World Bank Energy Data', fn: async () => {
    const res = await fetch(
      'https://api.worldbank.org/v2/en/indicator/EG.USE.PCAP.KG.OE?mrv=1&format=json',
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const [, data] = await res.json();
    return data?.length ? { data: data.slice(0, 10), source: 'World Bank Energy Use' } : null;
  }},
];

/**
 * Run the fallback chain – tries each source in order, returns first success.
 */
export async function runFallbackChain(): Promise<FallbackResult> {
  for (let i = 0; i < FALLBACKS.length; i++) {
    const fb = FALLBACKS[i];
    try {
      const result = await fb.fn();
      if (result != null) {
        return {
          success: true,
          fallbackIndex: i + 1,
          fallbackName: fb.name,
          data: result as Record<string, unknown>,
        };
      }
    } catch {
      // silent – try next
    }
  }
  return {
    success: false,
    message: 'No live data sources available',
    lastKnown: 'OPEC 2025 / EIA April 2026',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Run ALL fallbacks in parallel and return everything that succeeds.
 * Useful for building the global fuel table.
 */
export async function runAllFallbacks(): Promise<Record<string, unknown>> {
  const results = await Promise.allSettled(FALLBACKS.map(fb => fb.fn()));
  const combined: Record<string, unknown> = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value != null) {
      combined[`source_${i + 1}_${FALLBACKS[i].name.replace(/\s+/g, '_').toLowerCase()}`] = r.value;
    }
  });
  return combined;
}
