import { NextResponse } from "next/server";
import { loadCountriesData } from "@/lib/data";

export async function GET() {
  try {
    const countries = await loadCountriesData();

    return NextResponse.json({
      success: true,
      data: countries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries data" },
      { status: 500 }
    );
  }
}
