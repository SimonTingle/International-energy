import "server-only";
import { CountryData } from "./types";
import { readFileSync } from "fs";
import { join } from "path";
import { getAllCountriesLatestResources } from "./db";

export async function loadCountriesData(): Promise<CountryData[]> {
  try {
    // Try to load from database first
    const dbData = await getAllCountriesLatestResources();

    if (dbData && dbData.length > 0) {
      console.log(
        `📊 DATA: Loaded ${dbData.length} countries from PostgreSQL database`,
        {
          timestamp: new Date().toISOString(),
        }
      );

      // Transform database rows to CountryData format
      return dbData.map((row: any) => ({
        id: row.country_id,
        name: row.name,
        region: row.region,
        coordinates: row.coordinates.split("(")[1].split(")")[0].split(",").map((v: string) => parseFloat(v)),
        resources: {
          oil: row.oil || 0,
          gas: row.gas || 0,
          coal: row.coal || 0,
          diesel: row.diesel || 0,
          renewables: row.renewables || 0,
          nuclear: row.nuclear || 0,
        },
        lastUpdated: row.timestamp ? new Date(row.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    }
  } catch (error) {
    console.warn(
      "⚠️  WARNING: Failed to load from database, falling back to static JSON:",
      error
    );
  }

  // Fallback to static JSON if database fails
  try {
    const filePath = join(process.cwd(), "public", "countries-data.json");
    const data = readFileSync(filePath, "utf-8");
    const countries = JSON.parse(data);
    console.log(`📊 DATA: Loaded ${countries.length} countries from countries-data.json (fallback)`, {
      sources: "OpenStreetMap, World Bank",
      timestamp: new Date().toISOString(),
    });
    return countries;
  } catch (error) {
    console.error("❌ ERROR: Failed to load countries data:", error);
    return [];
  }
}
