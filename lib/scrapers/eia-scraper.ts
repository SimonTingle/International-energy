import axios from "axios";
import { logScrapeOperation } from "@/lib/db";

/**
 * EIA (U.S. Energy Information Administration) Data Scraper
 * Fetches energy data from public EIA APIs
 * Free API key required from https://www.eia.gov/opendata/
 */
export async function scrapeEIAData(): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  try {
    const apiKey = process.env.EIA_API_KEY;

    if (!apiKey) {
      console.warn("EIA_API_KEY not configured, skipping EIA scraper");
      return results;
    }

    // EIA API endpoints for different fuel types
    const endpoints = {
      oil: "PET.MCREXUS1.M", // Crude Oil Imports
      gas: "NG.N7411A2.M", // Natural Gas Production
      coal: "COAL.MCOAL.M", // Coal Production
    };

    for (const [fuelType, seriesId] of Object.entries(endpoints)) {
      try {
        const response = await axios.get(
          `https://api.eia.gov/series/?api_key=${apiKey}&series_id=${seriesId}`,
          { timeout: 15000 }
        );

        if (response.data && response.data.series && response.data.series[0]) {
          const series = response.data.series[0];
          const latestData = series.data[0]; // Most recent data point

          // Parse country code from series name if available
          // This depends on EIA data structure
          console.log(`EIA ${fuelType} data retrieved:`, latestData);
        }
      } catch (error) {
        console.warn(`Failed to fetch EIA ${fuelType} data:`, error);
      }
    }

    await logScrapeOperation("eia", "success", results.size);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("EIA scraper error:", errorMessage);
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
