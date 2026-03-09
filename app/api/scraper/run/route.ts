import { NextRequest, NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers/orchestrator";

/**
 * API endpoint to trigger data scrapers
 * Can be called manually or via cron job
 * Protected by authorization header in production
 */
export async function POST(request: NextRequest) {
  try {
    console.log("\n📡 API ENDPOINT: /api/scraper/run");
    console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);

    // Verify authorization token for cron job
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;

    console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔑 Auth header present: ${!!authHeader}`);

    if (process.env.NODE_ENV === "production") {
      console.log("🔐 Production mode - verifying authorization...");
      if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        console.log("❌ Authorization failed");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      console.log("✅ Authorization successful");
    } else {
      console.log("ℹ️  Development mode - skipping authorization check");
    }

    console.log("\n🚀 Starting scraper orchestration...");
    const startTime = performance.now();
    const result = await runScrapers();
    const endTime = performance.now();

    console.log(
      `⏱️  Scraper execution time: ${(endTime - startTime).toFixed(2)}ms`
    );
    console.log(`\n📊 SCRAPER RESULTS:`);
    console.log(`  ✓ Success: ${result.success}`);
    console.log(`  📈 Records updated: ${result.recordsUpdated}`);
    console.log(`  ❌ Errors: ${result.errors.length}`);
    if (result.errors.length > 0) {
      console.log(`  Error details:`, result.errors);
    }

    return NextResponse.json({
      success: result.success,
      recordsUpdated: result.recordsUpdated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("\n❌ API ENDPOINT ERROR:", errorMessage);
    console.error("Stack trace:", error);

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
