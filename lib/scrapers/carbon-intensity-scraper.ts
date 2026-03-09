import axios from "axios";
import { logScrapeOperation } from "@/lib/db";
import { EnergyResources } from "@/lib/types";

interface GenerationMixItem {
  fuel: string;
  perc: number;
}

interface CarbonIntensityResponse {
  data: {
    from: string;
    to: string;
    generationmix: GenerationMixItem[];
  };
}

/**
 * Carbon Intensity API Scraper
 * Fetches UK electricity generation mix from the official Carbon Intensity API
 * Free API, no authentication required
 */
export async function scrapeCarbonIntensityData(): Promise<
  Map<string, EnergyResources>
> {
  const results = new Map<string, EnergyResources>();
  const startTime = performance.now();

  try {
    console.log("\n🔋 [CARBON INTENSITY] Starting scraper...");
    const url = "https://api.carbonintensity.org.uk/generation";
    console.log(`  📡 [CARBON INTENSITY] Fetching UK generation mix → ${url}`);

    const fetchStart = performance.now();
    const response = await axios.get<CarbonIntensityResponse>(url, {
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const fetchTime = (performance.now() - fetchStart).toFixed(0);

    console.log(`  ⏱️  [CARBON INTENSITY] Response ${response.status} in ${fetchTime}ms`);

    if (response.data && response.data.data && response.data.data.generationmix) {
      const mix = response.data.data.generationmix;
      console.log(`  📊 [CARBON INTENSITY] Generation mix (${mix.length} fuel types):`);

      let gas = 0;
      let coal = 0;
      let nuclear = 0;
      let renewables = 0;

      for (const item of mix) {
        const fuel = item.fuel.toLowerCase();
        const percentage = item.perc;
        console.log(`     ${fuel}: ${percentage}%`);

        if (fuel === "gas") {
          gas = percentage;
        } else if (fuel === "coal") {
          coal = percentage;
        } else if (fuel === "nuclear") {
          nuclear = percentage;
        } else if (
          fuel === "wind" ||
          fuel === "solar" ||
          fuel === "hydro" ||
          fuel === "biomass"
        ) {
          renewables += percentage;
        }
      }

      const ukResources: EnergyResources = {
        oil: 0,
        gas: Math.round(gas * 10),
        coal: Math.round(coal * 10),
        diesel: 0,
        renewables: Math.round(renewables * 10),
        nuclear: Math.round(nuclear * 10),
      };

      results.set("GB", ukResources);

      console.log(`  📊 [CARBON INTENSITY] UK mapped → gas:${ukResources.gas} coal:${ukResources.coal} nuclear:${ukResources.nuclear} renewables:${ukResources.renewables}`);
      console.log(`  📅 [CARBON INTENSITY] Data from: ${response.data.data.from}`);

      await logScrapeOperation("carbon-intensity", "success", 1, undefined);
    } else {
      console.warn(`  ⚠️  [CARBON INTENSITY] No generation mix data in response`);
    }

    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`  ✅ [CARBON INTENSITY] Complete: ${results.size} countries in ${elapsed}ms`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ [CARBON INTENSITY] Scraper error: ${errorMessage}`);
    await logScrapeOperation("carbon-intensity", "failed", 0, errorMessage);
  }

  return results;
}
