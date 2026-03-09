import { scrapeWorldBankData } from "./worldbank-scraper";
import { scrapeEIAData } from "./eia-scraper";
import { scrapeIEAData } from "./iea-scraper";
import { scrapeCarbonIntensityData } from "./carbon-intensity-scraper";
import { scrapeOWIDEnergyData } from "./owid-energy-scraper";
import { insertEnergyResources, logScrapeOperation } from "@/lib/db";

/**
 * Scraper Orchestrator
 * Coordinates all data scrapers and merges results
 */
export async function runScrapers(): Promise<{
  success: boolean;
  recordsUpdated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let recordsUpdated = 0;

  try {
    console.log("\n🔄 ORCHESTRATOR: Starting scraper orchestration");
    console.log("📋 Running 5 scrapers in parallel:");
    console.log("  1️⃣  World Bank (energy, GDP, population data)");
    console.log("  2️⃣  EIA - Energy Information Administration (US energy data)");
    console.log("  3️⃣  IEA - International Energy Agency (global energy data)");
    console.log("  4️⃣  Carbon Intensity (emissions data)");
    console.log("  5️⃣  OWID - Our World in Data (energy statistics)");

    const startTime = performance.now();

    // Run all scrapers in parallel
    console.log("\n⏳ Awaiting all scrapers...");
    const [wbData, eiaData, ieaData, carbonIntensityData, owidData] = await Promise.allSettled([
      scrapeWorldBankData(),
      scrapeEIAData(),
      scrapeIEAData(),
      scrapeCarbonIntensityData(),
      scrapeOWIDEnergyData(),
    ]);

    const scrapersEndTime = performance.now();
    console.log(
      `✅ All scrapers completed in ${(scrapersEndTime - startTime).toFixed(2)}ms\n`
    );

    // Merge results from all scrapers
    const mergedData = new Map<string, any>();

    // Process World Bank data
    console.log("📥 Processing World Bank data...");
    if (wbData.status === "fulfilled") {
      wbData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`  ✅ World Bank: ${wbData.value.size} countries processed`);
    } else {
      const error = `World Bank scraper failed: ${wbData.reason}`;
      console.log(`  ❌ ${error}`);
      errors.push(error);
    }

    // Process EIA data
    console.log("📥 Processing EIA data...");
    if (eiaData.status === "fulfilled") {
      eiaData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`  ✅ EIA: ${eiaData.value.size} countries processed`);
    } else {
      const error = `EIA scraper failed: ${eiaData.reason}`;
      console.log(`  ❌ ${error}`);
      errors.push(error);
    }

    // Process IEA data
    console.log("📥 Processing IEA data...");
    if (ieaData.status === "fulfilled") {
      ieaData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`  ✅ IEA: ${ieaData.value.size} countries processed`);
    } else {
      const error = `IEA scraper failed: ${ieaData.reason}`;
      console.log(`  ❌ ${error}`);
      errors.push(error);
    }

    // Process Carbon Intensity data
    console.log("📥 Processing Carbon Intensity data...");
    if (carbonIntensityData.status === "fulfilled") {
      carbonIntensityData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(
        `  ✅ Carbon Intensity: ${carbonIntensityData.value.size} countries processed`
      );
    } else {
      const error = `Carbon Intensity scraper failed: ${carbonIntensityData.reason}`;
      console.log(`  ❌ ${error}`);
      errors.push(error);
    }

    // Process OWID Energy data
    console.log("📥 Processing OWID Energy data...");
    if (owidData.status === "fulfilled") {
      owidData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`  ✅ OWID Energy: ${owidData.value.size} countries processed`);
    } else {
      const error = `OWID Energy scraper failed: ${owidData.reason}`;
      console.log(`  ❌ ${error}`);
      errors.push(error);
    }

    // Log merged data summary before insertion
    console.log(`\n📋 MERGED DATA SUMMARY (${mergedData.size} countries):`);
    for (const [countryCode, resources] of mergedData) {
      const fields = Object.entries(resources)
        .filter(([, v]) => v !== undefined && v !== null && v !== 0)
        .map(([k, v]) => `${k}:${typeof v === "number" ? (v as number).toFixed(1) : v}`)
        .join(" | ");
      console.log(`  ${countryCode}: ${fields || "(empty)"}`);
    }

    // Insert merged data into database
    console.log(`\n💾 Inserting merged data into database...`);
    console.log(`📊 Total countries to update: ${mergedData.size}`);

    let insertSuccessCount = 0;
    let insertFailureCount = 0;

    for (const [countryCode, resources] of mergedData) {
      try {
        await insertEnergyResources(countryCode, resources, "merged-scrape");
        recordsUpdated++;
        insertSuccessCount++;
      } catch (error) {
        insertFailureCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("DATABASE_URL not configured")) {
          console.warn(`  ⚠️  DB not configured — skipping all inserts`);
          break;
        }
        console.error(`  ❌ Failed to insert data for ${countryCode}: ${errorMsg}`);
      }
    }

    console.log(
      `\n✅ Database insertion complete:`
    );
    console.log(`  ✓ Successful inserts: ${insertSuccessCount}`);
    console.log(`  ✗ Failed inserts: ${insertFailureCount}`);

    const endTime = performance.now();
    console.log(
      `\n🏁 Scraper orchestration complete in ${(endTime - startTime).toFixed(2)}ms`
    );
    console.log(`📈 Total records updated: ${recordsUpdated}`);
    console.log(`❌ Total errors: ${errors.length}\n`);

    await logScrapeOperation(
      "orchestrator",
      "success",
      recordsUpdated,
      errors.length > 0 ? errors.join(", ") : undefined
    );

    return {
      success: errors.length === 0,
      recordsUpdated,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("\n❌ ORCHESTRATOR ERROR:", errorMessage);
    console.error("Error details:", error);

    await logScrapeOperation(
      "orchestrator",
      "failed",
      recordsUpdated,
      errorMessage
    );

    return {
      success: false,
      recordsUpdated,
      errors: [...errors, errorMessage],
    };
  }
}
