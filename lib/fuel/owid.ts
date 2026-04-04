/**
 * Our World in Data (OWID) – free, no API key required
 * Data sourced directly from GitHub raw CSV files
 * https://github.com/owid/energy-data
 */

const OWID_ENERGY_CSV =
  'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';

// BP Statistical Review oil reserves (via OWID)
const OWID_OIL_RESERVES_CSV =
  'https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/Oil%20proved%20reserves%20-%20BP/Oil%20proved%20reserves%20-%20BP.csv';

interface OWIDEnergyRow {
  country: string;
  year: string;
  oil_production?: string;     // TWh
  gas_production?: string;     // TWh
  coal_production?: string;    // TWh
  oil_share_energy?: string;   // %
  renewables_share_energy?: string;
  [key: string]: string | undefined;
}

/** Parse a CSV string into array of objects using header row */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim().replace(/^"|"$/g, ''); });
    return row;
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

/**
 * Fetch OWID energy CSV and return the latest row per country with
 * oil/gas/coal production figures.
 */
export async function fetchOWIDProduction() {
  try {
    const res = await fetch(OWID_ENERGY_CSV, {
      next: { revalidate: 86400 }, // 24 h cache – dataset updates ~monthly
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseCSV(text) as OWIDEnergyRow[];

    // Keep only rows with an ISO code (3-letter), skip continents/groups
    const ISO3_RE = /^[A-Z]{3}$/;
    const byCountry = new Map<string, OWIDEnergyRow>();
    for (const row of rows) {
      if (!row.iso_code || !ISO3_RE.test(row.iso_code)) continue;
      const prev = byCountry.get(row.iso_code);
      if (!prev || Number(row.year) > Number(prev.year)) {
        byCountry.set(row.iso_code, row);
      }
    }

    const countries = Array.from(byCountry.values()).map(row => ({
      iso3: row.iso_code!,
      country: row.country,
      year: row.year,
      oil_production_twh: row.oil_production ? Number(row.oil_production) : null,
      gas_production_twh: row.gas_production ? Number(row.gas_production) : null,
      coal_production_twh: row.coal_production ? Number(row.coal_production) : null,
      renewables_share_pct: row.renewables_share_energy ? Number(row.renewables_share_energy) : null,
    }));

    return {
      source: 'Our World in Data – Energy Dataset',
      sourceUrl: 'https://github.com/owid/energy-data',
      fetchedAt: new Date().toISOString(),
      countries,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch OWID oil reserves CSV (BP Statistical Review data)
 * Returns latest reserves per country in billion barrels.
 */
export async function fetchOWIDOilReserves() {
  try {
    const res = await fetch(OWID_OIL_RESERVES_CSV, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseCSV(text);

    // Columns: Entity, Code, Year, Oil proved reserves (...)
    const reservesCol = Object.keys(rows[0] ?? {}).find(k =>
      k.toLowerCase().includes('reserve') || k.toLowerCase().includes('oil')
    );
    if (!reservesCol) return null;

    const byCountry = new Map<string, { country: string; code: string; year: string; reserves_bb: number }>();
    for (const row of rows) {
      if (!row.Code || !/^[A-Z]{3}$/.test(row.Code)) continue;
      const val = Number(row[reservesCol]);
      if (isNaN(val)) continue;
      const prev = byCountry.get(row.Code);
      if (!prev || Number(row.Year) > Number(prev.year)) {
        byCountry.set(row.Code, {
          country: row.Entity,
          code: row.Code,
          year: row.Year,
          reserves_bb: val,
        });
      }
    }

    return {
      source: 'Our World in Data – Oil Proved Reserves (BP Statistical Review)',
      sourceUrl: OWID_OIL_RESERVES_CSV,
      fetchedAt: new Date().toISOString(),
      unit: 'billion barrels',
      countries: Array.from(byCountry.values()),
    };
  } catch {
    return null;
  }
}

/**
 * Convenience: get a single country's latest OWID production row
 */
export async function fetchOWIDCountry(iso3: string) {
  const result = await fetchOWIDProduction();
  if (!result) return null;
  const country = result.countries.find(c => c.iso3 === iso3.toUpperCase());
  if (!country) return null;
  return { ...country, source: result.source, sourceUrl: result.sourceUrl };
}
