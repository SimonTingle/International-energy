import { scrapeWorldBankData } from "./worldbank-scraper";
import { scrapeEIAData } from "./eia-scraper";
import { scrapeIEAData } from "./iea-scraper";
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
    console.log("Starting scraper orchestration...");

    // Run all scrapers in parallel
    const [wbData, eiaData, ieaData] = await Promise.allSettled([
      scrapeWorldBankData(),
      scrapeEIAData(),
      scrapeIEAData(),
    ]);

    // Merge results from all scrapers
    const mergedData = new Map<string, any>();

    // Process World Bank data
    if (wbData.status === "fulfilled") {
      wbData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`World Bank: ${wbData.value.size} countries processed`);
    } else {
      errors.push(
        `World Bank scraper failed: ${wbData.reason}`
      );
    }

    // Process EIA data
    if (eiaData.status === "fulfilled") {
      eiaData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`EIA: ${eiaData.value.size} countries processed`);
    } else {
      errors.push(`EIA scraper failed: ${eiaData.reason}`);
    }

    // Process IEA data
    if (ieaData.status === "fulfilled") {
      ieaData.value.forEach((value, key) => {
        if (!mergedData.has(key)) {
          mergedData.set(key, {});
        }
        Object.assign(mergedData.get(key), value);
      });
      console.log(`IEA: ${ieaData.value.size} countries processed`);
    } else {
      errors.push(`IEA scraper failed: ${ieaData.reason}`);
    }

    // Insert merged data into database
    for (const [countryCode, resources] of mergedData) {
      try {
        await insertEnergyResources(countryCode, resources, "merged-scrape");
        recordsUpdated++;
      } catch (error) {
        console.error(
          `Failed to insert data for ${countryCode}:`,
          error
        );
      }
    }

    console.log(
      `Scraper orchestration complete. Updated ${recordsUpdated} records.`
    );
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
    console.error("Orchestrator error:", errorMessage);
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
