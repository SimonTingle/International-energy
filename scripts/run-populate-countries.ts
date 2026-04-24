/**
 * Standalone script to populate countries-data.json
 * Run manually: npx ts-node scripts/run-populate-countries.ts
 * Never imported by the app — safe to have side effects here.
 */

import path from "path";
import fs from "fs";
import { populateAllCountries, validateCountries } from "../lib/generators/populate-countries";

(async () => {
  try {
    console.log("Populating all 195 countries...");
    const allCountries = await populateAllCountries();

    console.log(`Total countries: ${allCountries.length}`);

    const validation = validateCountries(allCountries);
    console.log("Validation result:", validation);

    if (!validation.valid) {
      console.error("Validation errors:", validation.errors);
      process.exit(1);
    }

    const outputPath = path.join(process.cwd(), "public", "countries-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(allCountries, null, 2));
    console.log(`✓ Wrote ${allCountries.length} countries to ${outputPath}`);

    const regions = new Map<string, number>();
    allCountries.forEach((c) => {
      regions.set(c.region, (regions.get(c.region) || 0) + 1);
    });
    console.log("\nRegional breakdown:");
    Array.from(regions.entries()).forEach(([region, count]) => {
      console.log(`  ${region}: ${count}`);
    });

    console.log("\n✓ Population complete!");
  } catch (error) {
    console.error("Error during population:", error);
    process.exit(1);
  }
})();
