import axios from "axios";
import { logScrapeOperation } from "@/lib/db";
import { EnergyResources } from "@/lib/types";

interface OWIDEnergyRow {
  country: string;
  code: string;
  year: number;
  [key: string]: any;
}

/**
 * Our World in Data Energy Scraper
 * Fetches global energy data (production, capacity) from free OWID dataset
 * Free data from GitHub, no authentication required
 * Source: https://github.com/owid/energy-data
 */
export async function scrapeOWIDEnergyData(): Promise<
  Map<string, EnergyResources>
> {
  const results = new Map<string, EnergyResources>();
  const startTime = performance.now();

  try {
    console.log("\n📈 [OWID] Starting scraper...");
    const csvUrl =
      "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv";
    console.log(`  📡 [OWID] Fetching CSV dataset → ${csvUrl}`);

    const fetchStart = performance.now();
    const response = await axios.get(csvUrl, {
      timeout: 30000,
      headers: {
        Accept: "text/csv",
      },
    });
    const fetchTime = (performance.now() - fetchStart).toFixed(0);

    console.log(`  ⏱️  [OWID] Response ${response.status} in ${fetchTime}ms`);

    if (!response.data) {
      console.warn("  ⚠️  [OWID] No data returned from OWID");
      await logScrapeOperation("owid-energy", "failed", 0, "No data returned");
      return results;
    }

    // Parse CSV data
    const lines = response.data.split("\n");
    console.log(`  📄 [OWID] CSV size: ${lines.length} rows`);

    if (lines.length < 2) {
      console.warn("  ⚠️  [OWID] Invalid CSV format (< 2 rows)");
      await logScrapeOperation("owid-energy", "failed", 0, "Invalid CSV format");
      return results;
    }

    const headers = lines[0].split(",").map((h: string) => h.trim());
    const countryIdx = headers.indexOf("country");
    const codeIdx = headers.indexOf("code");
    const yearIdx = headers.indexOf("year");

    console.log(`  🔍 [OWID] Parsing columns: country(${countryIdx}), code(${codeIdx}), year(${yearIdx})`);

    const latestYearData = new Map<string, OWIDEnergyRow>();

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",").map((v: string) => v.trim());
      if (values.length < headers.length) continue;

      const country = values[countryIdx];
      const code = values[codeIdx];
      const year = parseInt(values[yearIdx], 10);

      if (!latestYearData.has(code) || latestYearData.get(code)!.year < year) {
        const row: OWIDEnergyRow = { country, code, year };
        headers.forEach((header: string, idx: number) => {
          row[header] = values[idx];
        });
        latestYearData.set(code, row);
      }
    }

    console.log(`  📊 [OWID] Found latest-year data for ${latestYearData.size} entities`);

    // Extract energy values
    latestYearData.forEach((row) => {
      try {
        const countryCode = row.code;
        if (!countryCode || countryCode.length !== 3) return;

        const resources: EnergyResources = {
          oil: parseFloat(row["oil_production"] || row["oil_consumption"] || "0") || 0,
          gas: parseFloat(row["gas_production"] || row["gas_consumption"] || "0") || 0,
          coal: parseFloat(row["coal_production"] || row["coal_consumption"] || "0") || 0,
          diesel: parseFloat(row["oil_consumption"] || "0") * 0.3 || 0,
          renewables: parseFloat(row["renewables_consumption"] || row["renewables_production"] || "0") || 0,
          nuclear: parseFloat(row["nuclear_consumption"] || row["nuclear_production"] || "0") || 0,
        };

        if (Object.values(resources).some((v) => v > 0)) {
          results.set(countryCode, resources);
        }
      } catch (error) {
        console.warn(`  ⚠️  [OWID] Parse error for ${row.country}:`, error);
      }
    });

    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`  ✅ [OWID] Complete: ${results.size} countries with data in ${elapsed}ms`);

    // Log a sample of countries parsed
    const sample = Array.from(results.keys()).slice(0, 5);
    console.log(`  🔎 [OWID] Sample countries: ${sample.join(", ")}...`);

    await logScrapeOperation("owid-energy", "success", results.size, undefined);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ [OWID] Scraper error: ${errorMessage}`);
    await logScrapeOperation("owid-energy", "failed", 0, errorMessage);
  }

  return results;
}
