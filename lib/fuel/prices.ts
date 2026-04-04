/**
 * Fuel price data from free public sources
 *
 * Sources (all free, no API key unless noted):
 *  1. EIA retail pump prices – US gasoline & diesel (free key from eia.gov)
 *  2. Global Petrol Prices scrape – worldwide gasoline prices
 *  3. World Bank commodity prices API – free, no key
 *  4. Trading Economics public JSON – some free endpoints
 */

export interface FuelPrice {
  country: string;
  currency: string;
  gasoline_per_liter?: number;
  diesel_per_liter?: number;
  period: string;
  source: string;
  sourceUrl: string;
}

// ---------------------------------------------------------------------------
// World Bank Commodity Prices (free, no key)
// Series: CRUDE_BRENT  CRUDE_WTI  CRUDE_DUBAI
// ---------------------------------------------------------------------------

const WB_COMMODITY_URL =
  'https://api.worldbank.org/v2/en/indicator/PNRGASOIL_USD?downloadformat=json&mrv=1&format=json';

/** Crude oil spot prices from World Bank (free, no key) */
export async function fetchWorldBankOilPrices() {
  try {
    // World Bank commodity price data endpoint
    const res = await fetch(
      'https://api.worldbank.org/v2/en/indicator/PNGASEUUSDM?mrv=3&format=json',
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const [meta, data] = await res.json();
    if (!data?.length) return null;
    const latest = data.find((d: { value: number | null }) => d.value != null);
    if (!latest) return null;
    return {
      source: 'World Bank – Natural Gas Prices',
      sourceUrl: 'https://data.worldbank.org/indicator/PNGASEUUSDM',
      period: latest.date,
      value: latest.value,
      unit: 'USD per million BTU',
      metric: 'natural_gas_price',
    };
  } catch {
    return null;
  }
}

/** Crude oil Brent price from World Bank */
export async function fetchWorldBankBrentCrude() {
  try {
    const res = await fetch(
      'https://api.worldbank.org/v2/en/indicator/PBRENT_USD?mrv=1&format=json',
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const [, data] = await res.json();
    if (!data?.length) return null;
    const latest = data.find((d: { value: number | null }) => d.value != null);
    if (!latest) return null;
    return {
      source: 'World Bank – Brent Crude Oil Price',
      sourceUrl: 'https://data.worldbank.org/indicator/PBRENT_USD',
      period: latest.date,
      value: Number(latest.value),
      unit: 'USD per barrel',
      metric: 'brent_crude_usd_bbl',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Global Petrol Prices (public HTML scrape – no key needed)
// ---------------------------------------------------------------------------

export async function fetchGlobalPetrolPrices(): Promise<FuelPrice[]> {
  try {
    const res = await fetch('https://www.globalpetrolprices.com/gasoline_prices/', {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FuelTracker/1.0)' },
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Extract the embedded JSON-like table from the page
    // globalpetrolprices embeds data in a <script> as a JS array
    const match = html.match(/var\s+countryArray\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return [];

    // Parse: each entry is [country, price_usd, price_local, currency, ...]
    const raw: string[][] = JSON.parse(match[1]);
    return raw.map(row => ({
      country: row[0] ?? '',
      currency: 'USD',
      gasoline_per_liter: row[1] ? Number(row[1]) : undefined,
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      source: 'GlobalPetrolPrices.com',
      sourceUrl: 'https://www.globalpetrolprices.com/gasoline_prices/',
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// EIA retail prices (requires free key)
// ---------------------------------------------------------------------------

export async function fetchEIAFuelPrices() {
  const key = process.env.EIA_API_KEY;
  if (!key) return null;

  try {
    const [gasolineRes, dieselRes] = await Promise.all([
      fetch(
        `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${key}&frequency=weekly&data[0]=value&facets[series][]=EMM_EPMRR_PTE_NUS_DPG&sort[0][column]=period&sort[0][direction]=desc&length=1`,
        { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
      ),
      fetch(
        `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${key}&frequency=weekly&data[0]=value&facets[series][]=EMM_EPD2D_PTE_NUS_DPG&sort[0][column]=period&sort[0][direction]=desc&length=1`,
        { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
      ),
    ]);

    const [gasJson, dieselJson] = await Promise.all([
      gasolineRes.ok ? gasolineRes.json() : null,
      dieselRes.ok ? dieselRes.json() : null,
    ]);

    return {
      country: 'United States',
      currency: 'USD',
      gasoline_per_liter: gasJson?.response?.data?.[0]?.value
        ? Number(gasJson.response.data[0].value) / 3.785  // gal → L
        : undefined,
      diesel_per_liter: dieselJson?.response?.data?.[0]?.value
        ? Number(dieselJson.response.data[0].value) / 3.785
        : undefined,
      period: gasJson?.response?.data?.[0]?.period ?? '',
      source: 'EIA Weekly Retail Fuel Prices',
      sourceUrl: 'https://www.eia.gov/petroleum/gasdiesel/',
    } as FuelPrice;
  } catch {
    return null;
  }
}

/** Aggregate all available price data */
export async function fetchAllFuelPrices() {
  const [eia, wb, globalPrices] = await Promise.allSettled([
    fetchEIAFuelPrices(),
    fetchWorldBankBrentCrude(),
    fetchGlobalPetrolPrices(),
  ]);

  return {
    us_retail: eia.status === 'fulfilled' ? eia.value : null,
    brent_crude: wb.status === 'fulfilled' ? wb.value : null,
    global_gasoline: globalPrices.status === 'fulfilled' ? globalPrices.value : [],
    fetchedAt: new Date().toISOString(),
  };
}
