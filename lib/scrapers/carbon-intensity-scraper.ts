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

  try {
    // Fetch current generation mix for GB
    const url = "https://api.carbonintensity.org.uk/generation";
    const response = await axios.get<CarbonIntensityResponse>(url, {
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (response.data && response.data.data && response.data.data.generationmix) {
      const mix = response.data.data.generationmix;

      // Map generation mix to EnergyResources
      let gas = 0;
      let coal = 0;
      let nuclear = 0;
      let renewables = 0; // wind + solar + hydro + biomass

      for (const item of mix) {
        const fuel = item.fuel.toLowerCase();
        const percentage = item.perc;

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

      // Create energy resources object for UK (GB)
      const ukResources: EnergyResources = {
        oil: 0, // Not part of UK grid generation
        gas: Math.round(gas * 10), // Scale percentages
        coal: Math.round(coal * 10),
        diesel: 0, // Not part of UK grid generation
        renewables: Math.round(renewables * 10),
        nuclear: Math.round(nuclear * 10),
      };

      results.set("GB", ukResources);

      console.log(
        `Carbon Intensity API: Updated UK generation mix from ${response.data.data.from}`
      );
      await logScrapeOperation(
        "carbon-intensity",
        "success",
        1,
        undefined
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Carbon Intensity scraper error:", errorMessage);
    await logScrapeOperation(
      "carbon-intensity",
      "failed",
      0,
      errorMessage
    );
  }

  return results;
}
