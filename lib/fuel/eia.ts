/**
 * EIA (U.S. Energy Information Administration) API v2 client
 * Free API key: https://www.eia.gov/opendata/register.php
 * No key = US data unavailable, all other sources still work
 */

const EIA_BASE = 'https://api.eia.gov/v2';

async function eiaGet(path: string, extra: Record<string, string> = {}) {
  const key = process.env.EIA_API_KEY;
  if (!key) return null;

  const url = new URL(`${EIA_BASE}/${path}`);
  url.searchParams.set('api_key', key);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.response?.data ?? null;
}

/** Latest US weekly crude oil stocks (thousand barrels) */
export async function fetchUSCrudeStocks() {
  const data = await eiaGet('petroleum/stoc/wstk/data/', {
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[product][]': 'EPC0',
    'facets[duoarea][]': 'NUS',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA Weekly Crude Oil Stocks',
    sourceUrl: 'https://www.eia.gov/dnav/pet/pet_stoc_wstk_dcu_nus_w.htm',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'thousand barrels',
    metric: 'us_crude_stocks_kb',
  };
}

/** Latest US weekly motor gasoline stocks (thousand barrels) */
export async function fetchUSGasolineStocks() {
  const data = await eiaGet('petroleum/stoc/wstk/data/', {
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[product][]': 'EPM0',
    'facets[duoarea][]': 'NUS',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA Weekly Gasoline Stocks',
    sourceUrl: 'https://www.eia.gov/dnav/pet/pet_stoc_wstk_dcu_nus_w.htm',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'thousand barrels',
    metric: 'us_gasoline_stocks_kb',
  };
}

/** Latest US weekly distillate fuel oil stocks (thousand barrels) */
export async function fetchUSDistillateStocks() {
  const data = await eiaGet('petroleum/stoc/wstk/data/', {
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[product][]': 'EPD0',
    'facets[duoarea][]': 'NUS',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA Weekly Distillate Stocks',
    sourceUrl: 'https://www.eia.gov/dnav/pet/pet_stoc_wstk_dcu_nus_w.htm',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'thousand barrels',
    metric: 'us_distillate_stocks_kb',
  };
}

/** US regular gasoline retail price (cents per gallon) */
export async function fetchUSGasolinePrice() {
  const data = await eiaGet('petroleum/pri/gnd/data/', {
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[series][]': 'EMM_EPMRR_PTE_NUS_DPG',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA US Gasoline Retail Prices',
    sourceUrl: 'https://www.eia.gov/petroleum/gasdiesel/',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'dollars per gallon',
    metric: 'us_gasoline_price_usd',
  };
}

/** US diesel retail price (dollars per gallon) */
export async function fetchUSDieselPrice() {
  const data = await eiaGet('petroleum/pri/gnd/data/', {
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[series][]': 'EMM_EPD2D_PTE_NUS_DPG',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA US Diesel Retail Prices',
    sourceUrl: 'https://www.eia.gov/petroleum/gasdiesel/',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'dollars per gallon',
    metric: 'us_diesel_price_usd',
  };
}

/** US crude oil proved reserves (billion barrels, annual) */
export async function fetchUSCrudeReserves() {
  const data = await eiaGet('petroleum/crd/pres/data/', {
    frequency: 'annual',
    'data[0]': 'value',
    'facets[duoarea][]': 'NUS',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA US Crude Oil Proved Reserves',
    sourceUrl: 'https://www.eia.gov/naturalgas/crudeoilreserves/',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'million barrels',
    metric: 'us_crude_reserves_mb',
  };
}

/** US crude oil production (thousand barrels/day, monthly) */
export async function fetchUSCrudeProduction() {
  const data = await eiaGet('petroleum/crd/crpdn/data/', {
    frequency: 'monthly',
    'data[0]': 'value',
    'facets[duoarea][]': 'NUS',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  });
  if (!data?.[0]) return null;
  return {
    source: 'EIA US Crude Oil Production',
    sourceUrl: 'https://www.eia.gov/dnav/pet/pet_crd_crpdn_adc_mbbl_m.htm',
    period: data[0].period,
    value: Number(data[0].value),
    unit: 'thousand barrels per day',
    metric: 'us_crude_production_kbd',
  };
}

/**
 * International oil production by country (annual, thousand barrels/day)
 * Returns an array of { countryId, countryName, value, period }
 */
export async function fetchIntlOilProduction() {
  const data = await eiaGet('international/data/', {
    frequency: 'annual',
    'data[0]': 'value',
    'facets[productId][]': '57',   // crude oil + condensate
    'facets[activityId][]': '1',   // production
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '300',
  });
  if (!data?.length) return null;

  // Get latest year per country
  const byCountry = new Map<string, { countryId: string; countryName: string; value: number; period: string }>();
  for (const row of data) {
    if (!byCountry.has(row.countryId) && row.value != null) {
      byCountry.set(row.countryId, {
        countryId: row.countryId,
        countryName: row.countryName ?? row.countryId,
        value: Number(row.value),
        period: row.period,
      });
    }
  }
  return {
    source: 'EIA International Energy Statistics',
    sourceUrl: 'https://www.eia.gov/international/data/world',
    unit: 'thousand barrels per day',
    countries: Array.from(byCountry.values()),
  };
}

/**
 * International oil reserves by country (billion barrels, annual)
 */
export async function fetchIntlOilReserves() {
  const data = await eiaGet('international/data/', {
    frequency: 'annual',
    'data[0]': 'value',
    'facets[productId][]': '57',
    'facets[activityId][]': '5',   // reserves
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '300',
  });
  if (!data?.length) return null;

  const byCountry = new Map<string, { countryId: string; countryName: string; value: number; period: string }>();
  for (const row of data) {
    if (!byCountry.has(row.countryId) && row.value != null) {
      byCountry.set(row.countryId, {
        countryId: row.countryId,
        countryName: row.countryName ?? row.countryId,
        value: Number(row.value),
        period: row.period,
      });
    }
  }
  return {
    source: 'EIA International Oil Reserves',
    sourceUrl: 'https://www.eia.gov/international/data/world',
    unit: 'billion barrels',
    countries: Array.from(byCountry.values()),
  };
}
