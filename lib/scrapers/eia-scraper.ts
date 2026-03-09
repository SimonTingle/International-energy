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

    const endpoints = {
      oil: "PET.MCREXUS1.M", // Crude Oil Imports
      gas: "NG.N7411A2.M", // Natural Gas Production
      coal: "COAL.MCOAL.M", // Coal Production
    };

    for (const [fuelType, seriesId] of Object.entries(endpoints)) {
      try {
        const url = `https://api.eia.gov/series/?api_key=${apiKey}&series_id=${seriesId}`;
        console.log(`  📡 [EIA] Fetching ${fuelType} → ${seriesId}`);

        const fetchStart = performance.now();
        const response = await axios.get(url, { timeout: 15000 });
        const fetchTime = (performance.now() - fetchStart).toFixed(0);

        console.log(`  ⏱️  [EIA] Response ${response.status} in ${fetchTime}ms`);

        if (response.data && response.data.series && response.data.series[0]) {
          const series = response.data.series[0];
          const latestData = series.data[0];

          if (!results.has("US")) {
            results.set("US", {});
          }

          const countryData = results.get("US");
          if (latestData && latestData[0]) {
            countryData[fuelType] = parseFloat(latestData[0]);
            results.set("US", countryData);
            console.log(`  📊 [EIA] ${fuelType} = ${latestData[0]} (US)`);
          }
        } else {
          console.warn(`  ⚠️  [EIA] No series data returned for ${fuelType}`);
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

    // US total energy production
    const response = await axios.get(
      `https://api.eia.gov/series/?api_key=${apiKey}&series_id=SEDS.TETCB.US.A`,
      { timeout: 15000 }
    );

    if (response.data && response.data.series && response.data.series[0]) {
      return {
        country: "US",
        data: response.data.series[0].data,
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("Error fetching US energy data:", error);
  }

  return null;
}
