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

  try {
    // Fetch the OWID energy dataset from GitHub
    const csvUrl =
      "https://raw.githubusercontent.com/owid/energy-data/master/data/owid-energy-data.csv";

    const response = await axios.get(csvUrl, {
      timeout: 30000,
      headers: {
        Accept: "text/csv",
      },
    });

    if (!response.data) {
      console.warn("No data returned from OWID API");
      await logScrapeOperation("owid-energy", "failed", 0, "No data returned");
      return results;
    }

    // Parse CSV data
    const lines = response.data.split("\n");
    if (lines.length < 2) {
      console.warn("Invalid CSV format");
      await logScrapeOperation("owid-energy", "failed", 0, "Invalid CSV format");
      return results;
    }

    // Parse header row
    const headers = lines[0].split(",").map((h: string) => h.trim());
    const countryIdx = headers.indexOf("country");
    const codeIdx = headers.indexOf("code");
    const yearIdx = headers.indexOf("year");

    // Find relevant columns (using most recent year for each country)
    const latestYearData = new Map<string, OWIDEnergyRow>();

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",").map((v: string) => v.trim());
      if (values.length < headers.length) continue;

      const country = values[countryIdx];
      const code = values[codeIdx];
      const year = parseInt(values[yearIdx], 10);

      // Keep only the most recent year for each country
      if (!latestYearData.has(code) || latestYearData.get(code)!.year < year) {
        const row: OWIDEnergyRow = { country, code, year };
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        latestYearData.set(code, row);
      }
    }

    // Extract energy values from latest year data
    latestYearData.forEach((row) => {
      try {
        // Use ISO 3-letter country codes
        const countryCode = row.code;
        if (!countryCode || countryCode.length !== 3) return;

        const resources: EnergyResources = {
          oil: parseFloat(row["oil_production"] || row["oil_consumption"] || "0") || 0,
          gas: parseFloat(row["gas_production"] || row["gas_consumption"] || "0") || 0,
          coal: parseFloat(row["coal_production"] || row["coal_consumption"] || "0") || 0,
          diesel: parseFloat(row["oil_consumption"] || "0") * 0.3 || 0, // Estimate from oil consumption
          renewables: parseFloat(row["renewables_consumption"] || row["renewables_production"] || "0") || 0,
          nuclear: parseFloat(row["nuclear_consumption"] || row["nuclear_production"] || "0") || 0,
        };

        // Only store if we have at least some data
        if (Object.values(resources).some((v) => v > 0)) {
          results.set(countryCode, resources);
        }
      } catch (error) {
        // Skip rows with parsing errors
        console.warn(`Error parsing row for ${row.country}:`, error);
      }
    });

    console.log(
      `OWID Energy Scraper: Retrieved data for ${results.size} countries`
    );
    await logScrapeOperation(
      "owid-energy",
      "success",
      results.size,
      undefined
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("OWID Energy scraper error:", errorMessage);
    await logScrapeOperation("owid-energy", "failed", 0, errorMessage);
  }

  return results;
}
