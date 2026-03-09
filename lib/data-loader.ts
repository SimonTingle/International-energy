import "server-only";
import { CountryData } from "./types";
import { readFileSync } from "fs";
import { join } from "path";

export async function loadCountriesData(): Promise<CountryData[]> {
  try {
    const filePath = join(process.cwd(), "public", "countries-data.json");
    const data = readFileSync(filePath, "utf-8");
    const countries = JSON.parse(data);
    console.log(`📊 DATA: Loaded ${countries.length} countries from countries-data.json`, {
      sources: "OpenStreetMap, World Bank",
      timestamp: new Date().toISOString(),
    });
    return countries;
  } catch (error) {
    console.error("❌ ERROR: Failed to load countries data:", error);
    return [];
  }
}
