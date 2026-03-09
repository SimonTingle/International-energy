import axios from "axios";
import { logScrapeOperation } from "@/lib/db";

interface WorldBankIndicator {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: string;
  decimal: string;
}

/**
 * World Bank Data Scraper
 * Fetches renewable energy and environmental indicators
 * Free API, no key required
 */
export async function scrapeWorldBankData(): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const startTime = performance.now();

  try {
    console.log("\n🏦 [WORLD BANK] Starting scraper...");

    const indicators = {
      renewables: "EG.ELC.RNEW.ZS", // Renewable electricity output (% of total)
      cleanEnergy: "EG.ELC.NGAS.ZS", // Natural gas electricity (% of total)
    };

    for (const [type, indicator] of Object.entries(indicators)) {
      try {
        const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=500`;
        console.log(`  📡 [WORLD BANK] Fetching ${type} → ${indicator}`);
        console.log(`  🔗 [WORLD BANK] URL: ${url}`);

        const fetchStart = performance.now();
        const response = await axios.get(url, { timeout: 30000 });
        const fetchTime = (performance.now() - fetchStart).toFixed(0);

        console.log(`  ⏱️  [WORLD BANK] Response ${response.status} in ${fetchTime}ms`);

        if (response.data && response.data[1]) {
          let countForType = 0;
          response.data[1].forEach((item: WorldBankIndicator) => {
            if (
              item.value &&
              item.countryiso3code &&
              item.countryiso3code.length === 3
            ) {
              if (!results.has(item.countryiso3code)) {
                results.set(item.countryiso3code, {});
              }

              const countryData = results.get(item.countryiso3code);
              countryData[type] = parseFloat(item.value);
              results.set(item.countryiso3code, countryData);
              countForType++;
            }
          });
          console.log(`  📊 [WORLD BANK] ${type}: ${countForType} country records parsed`);
        } else {
          console.warn(`  ⚠️  [WORLD BANK] No data in response for ${type}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`  ❌ [WORLD BANK] Failed to fetch ${type} (${indicator}): ${msg}`);
      }
    }

    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`  ✅ [WORLD BANK] Complete: ${results.size} countries in ${elapsed}ms`);

    await logScrapeOperation("worldbank", "success", results.size, undefined);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ [WORLD BANK] Scraper error: ${errorMessage}`);
    await logScrapeOperation("worldbank", "failed", 0, errorMessage);
  }

  return results;
}

/**
 * Get renewable energy capacity data from World Bank
 */
export async function getWorldBankRenewableCapacity(
  countryCode: string
): Promise<number | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/EG.ELC.RNEW.ZS?format=json`;

    const response = await axios.get(url, { timeout: 15000 });

    if (response.data && response.data[1] && response.data[1].length > 0) {
      const value = response.data[1][0].value;
      return value ? parseFloat(value) : null;
    }
  } catch (error) {
    console.error(
      `Error fetching renewable capacity for ${countryCode}:`,
      error
    );
  }

  return null;
}

/**
 * Batch fetch renewable energy data for multiple countries
 */
export async function batchGetRenewableData(
  countryCodes: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  for (const code of countryCodes) {
    const capacity = await getWorldBankRenewableCapacity(code);
    if (capacity !== null) {
      results.set(code, capacity);
    }
  }

  return results;
}
