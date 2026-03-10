import "server-only";
import { CountryData } from "./types";
import { readFileSync } from "fs";
import { join } from "path";
import { getAllCountriesLatestResources } from "./db";

export async function loadCountriesData(): Promise<CountryData[]> {
  // Skip database if not configured (avoids ECONNREFUSED during build)
  if (!process.env.DATABASE_URL) {
    console.log("📊 DATA: DATABASE_URL not set — using static JSON fallback");
  } else {
    try {
      const dbData = await getAllCountriesLatestResources();

      if (dbData && dbData.length > 0) {
        console.log(
          `📊 DATA: Loaded ${dbData.length} countries from PostgreSQL database`,
          {
            timestamp: new Date().toISOString(),
          }
        );

        return dbData.map((row: any) => {
          // Handle PostgreSQL POINT type: pg driver returns {x, y} object
          // but it may also come as string "(x,y)" depending on driver version
          let coords: [number, number];
          if (typeof row.coordinates === 'string') {
            const parts = row.coordinates.replace(/[()]/g, '').split(',');
            coords = [parseFloat(parts[0]), parseFloat(parts[1])];
          } else if (row.coordinates && typeof row.coordinates === 'object') {
            coords = [row.coordinates.x, row.coordinates.y];
          } else {
            coords = [0, 0];
          }

          return {
            id: row.country_id,
            name: row.name,
            region: row.region,
            coordinates: coords,
            dataSource: "database" as const,
            resources: {
              oil: parseFloat(row.oil) || 0,
              gas: parseFloat(row.gas) || 0,
              coal: parseFloat(row.coal) || 0,
              diesel: parseFloat(row.diesel) || 0,
              renewables: parseFloat(row.renewables) || 0,
              nuclear: parseFloat(row.nuclear) || 0,
            },
            lastUpdated: row.timestamp ? new Date(row.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };
        });
      }
    } catch (error) {
      console.warn(
        "⚠️  WARNING: Failed to load from database, falling back to static JSON:",
        error
      );
    }
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
    return countries.map((c: any) => ({ ...c, dataSource: "fallback" }));
  } catch (error) {
    console.error("❌ ERROR: Failed to load countries data:", error);
    return [];
  }
}
