import axios from "axios";
import { logScrapeOperation } from "@/lib/db";

/**
 * EIA (U.S. Energy Information Administration) Data Scraper
 * Fetches energy data from public EIA APIs
 * Free API key required from https://www.eia.gov/opendata/
 */
export async function scrapeEIAData(): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const startTime = performance.now();

  try {
    console.log("\n⚡ [EIA] Starting scraper...");
    const apiKey = process.env.EIA_API_KEY;

    if (!apiKey) {
      console.warn("  ⚠️  [EIA] EIA_API_KEY not configured — skipping");
      return results;
    }

    // EIA APIv2 endpoints (v1 was retired)
    const endpoints = {
      oil: { route: "petroleum/crd/crpdn/data/", params: "frequency=monthly&data[0]=value&facets[duoarea][]=NUS&facets[product][]=EPC0&sort[0][column]=period&sort[0][direction]=desc&length=1" },
      gas: { route: "natural-gas/prod/sum/data/", params: "frequency=monthly&data[0]=value&facets[duoarea][]=NUS&facets[process][]=FGW&sort[0][column]=period&sort[0][direction]=desc&length=1" },
      coal: { route: "coal/production/data/", params: "frequency=quarterly&data[0]=value&facets[location][]=US&sort[0][column]=period&sort[0][direction]=desc&length=1" },
    };

    for (const [fuelType, { route, params }] of Object.entries(endpoints)) {
      try {
        const url = `https://api.eia.gov/v2/${route}?api_key=${apiKey}&${params}`;
        console.log(`  📡 [EIA] Fetching ${fuelType} (v2 API)`);

        const fetchStart = performance.now();
        const response = await axios.get(url, { timeout: 15000 });
        const fetchTime = (performance.now() - fetchStart).toFixed(0);

        console.log(`  ⏱️  [EIA] Response ${response.status} in ${fetchTime}ms`);

        if (response.data?.response?.data?.[0]) {
          const latestData = response.data.response.data[0];

          if (!results.has("US")) {
            results.set("US", {});
          }

          const countryData = results.get("US");
          const value = parseFloat(latestData.value);
          if (!isNaN(value)) {
            countryData[fuelType] = value;
            results.set("US", countryData);
            console.log(`  📊 [EIA] ${fuelType} = ${value} (US, period: ${latestData.period})`);
          }
        } else {
          console.warn(`  ⚠️  [EIA] No data returned for ${fuelType}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`  ❌ [EIA] Failed to fetch ${fuelType}: ${msg}`);
      }
    }

    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`  ✅ [EIA] Complete: ${results.size} countries in ${elapsed}ms`);

    await logScrapeOperation("eia", "success", results.size);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ [EIA] Scraper error: ${errorMessage}`);
    await logScrapeOperation("eia", "failed", 0, errorMessage);
  }

  return results;
}

/**
 * Fetch US-specific energy statistics from EIA
 */
export async function scrapeEIAUSEnergy(): Promise<any> {
  try {
    const apiKey = process.env.EIA_API_KEY;

    if (!apiKey) {
      return null;
    }

    // US total energy production (EIA APIv2)
    const response = await axios.get(
      `https://api.eia.gov/v2/seds/data/?api_key=${apiKey}&frequency=annual&data[0]=value&facets[seriesId][]=TETCB&facets[stateId][]=US&sort[0][column]=period&sort[0][direction]=desc&length=5`,
      { timeout: 15000 }
    );

    if (response.data?.response?.data) {
      return {
        country: "US",
        data: response.data.response.data,
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("Error fetching US energy data:", error);
  }

  return null;
}
