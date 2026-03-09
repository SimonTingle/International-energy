import "server-only";
import { CountryData } from "./types";
import { readFileSync } from "fs";
import { join } from "path";

export async function loadCountriesData(): Promise<CountryData[]> {
  try {
    const filePath = join(process.cwd(), "public", "countries-data.json");
    const data = readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading countries data:", error);
    return [];
  }
}
