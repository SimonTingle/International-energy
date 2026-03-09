import { NextResponse } from "next/server";
import { initializeDatabase, insertCountry, insertEnergyResources } from "@/lib/db";
import { loadCountriesData } from "@/lib/data";

// Initialize database and load sample data
export async function POST() {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Load sample countries data
    const countries = await loadCountriesData();

    // Insert countries and their resources
    for (const country of countries) {
      await insertCountry(
        country.id,
        country.name,
        country.region,
        country.coordinates
      );

      await insertEnergyResources(country.id, country.resources, "sample");
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized with sample data",
      countriesLoaded: countries.length,
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Database initialization failed",
      },
      { status: 500 }
    );
  }
}
