import { NextRequest, NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers/orchestrator";

/**
 * API endpoint to trigger data scrapers
 * Can be called manually or via cron job
 * Protected by authorization header in production
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization token for cron job
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production") {
      if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("Starting scraper job...");
    const result = await runScrapers();

    return NextResponse.json({
      success: result.success,
      recordsUpdated: result.recordsUpdated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Scraper endpoint error:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for cron job verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Scraper endpoint is ready. Use POST to trigger scrapers.",
    timestamp: new Date().toISOString(),
  });
}
