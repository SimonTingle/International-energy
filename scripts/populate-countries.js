const fs = require("fs");
const path = require("path");

// Load existing countries data
function loadExistingCountries() {
  const existingPath = path.join(__dirname, "../public/countries-data.json");
  const map = new Map();

  try {
    const data = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
    if (Array.isArray(data)) {
      data.forEach((country) => {
        map.set(country.id, country);
      });
    }
    console.log(`Loaded ${map.size} existing countries`);
  } catch (error) {
    console.log("No existing countries data found, starting fresh");
  }

  return map;
}

// Load countries reference
function loadCountriesReference() {
  const refPath = path.join(__dirname, "../lib/data/countries-reference.json");
  const data = JSON.parse(fs.readFileSync(refPath, "utf-8"));
  return data;
}

// Create default resources for a country
function createDefaultResources(country, existingCountries) {
  // If country already exists with real data, return it
  if (existingCountries.has(country.id)) {
    return existingCountries.get(country.id).resources;
  }

  // Regional multipliers for realistic defaults
  const regionalMultipliers = {
    "Middle East": {
      oil: 50.0,
      gas: 100.0,
      coal: 5.0,
      diesel: 5.0,
      renewables: 2.0,
      nuclear: 0.5,
    },
    Africa: {
      oil: 10.0,
      gas: 20.0,
      coal: 50.0,
      diesel: 3.0,
      renewables: 5.0,
      nuclear: 0.5,
    },
    Europe: {
      oil: 5.0,
      gas: 50.0,
      coal: 30.0,
      diesel: 2.0,
      renewables: 100.0,
      nuclear: 20.0,
    },
    Asia: {
      oil: 20.0,
      gas: 80.0,
      coal: 200.0,
      diesel: 10.0,
      renewables: 150.0,
      nuclear: 30.0,
    },
    "North America": {
      oil: 40.0,
      gas: 200.0,
      coal: 150.0,
      diesel: 20.0,
      renewables: 300.0,
      nuclear: 80.0,
    },
    "South America": {
      oil: 10.0,
      gas: 30.0,
      coal: 5.0,
      diesel: 2.0,
      renewables: 100.0,
      nuclear: 5.0,
    },
    Oceania: {
      oil: 2.0,
      gas: 20.0,
      coal: 30.0,
      diesel: 1.0,
      renewables: 20.0,
      nuclear: 0.0,
    },
  };

  const multiplier = regionalMultipliers[country.region] || {};

  return {
    oil: multiplier.oil || 5.0,
    gas: multiplier.gas || 30.0,
    coal: multiplier.coal || 40.0,
    diesel: multiplier.diesel || 2.0,
    renewables: multiplier.renewables || 10.0,
    nuclear: multiplier.nuclear || 2.0,
  };
}

// Main function to populate all countries
async function populateAllCountries() {
  console.log("Starting country population process...");

  const existingCountries = loadExistingCountries();
  const countriesReference = loadCountriesReference();
  const today = new Date().toISOString().split("T")[0];

  const allCountries = [];
  let preservedCount = 0;
  let newCount = 0;

  for (const countryRef of countriesReference) {
    let country;

    if (existingCountries.has(countryRef.id)) {
      // Keep existing country with real data
      country = existingCountries.get(countryRef.id);
      preservedCount++;
      allCountries.push(country);
    } else {
      // Create new country with default resources
      const resources = createDefaultResources(countryRef, existingCountries);

      country = {
        id: countryRef.id,
        name: countryRef.name,
        coordinates: countryRef.coordinates,
        region: countryRef.region,
        resources,
        lastUpdated: today,
      };

      newCount++;
      allCountries.push(country);
    }
  }

  return { allCountries, preservedCount, newCount };
}

// Validate populated countries
function validateCountries(countries) {
  const errors = [];
  const ids = new Set();

  if (countries.length !== 195) {
    errors.push(`Expected 195 countries, got ${countries.length}`);
  }

  countries.forEach((country, index) => {
    if (!country.id || country.id.length !== 2) {
      errors.push(`Invalid ID at index ${index}: ${country.id}`);
    }

    if (ids.has(country.id)) {
      errors.push(`Duplicate country ID: ${country.id}`);
    }
    ids.add(country.id);

    if (!country.name) {
      errors.push(`Missing name for country ${country.id}`);
    }

    if (
      !country.coordinates ||
      country.coordinates.length !== 2 ||
      typeof country.coordinates[0] !== "number" ||
      typeof country.coordinates[1] !== "number"
    ) {
      errors.push(`Invalid coordinates for ${country.id}`);
    }

    if (
      !country.resources ||
      typeof country.resources.oil !== "number" ||
      typeof country.resources.gas !== "number"
    ) {
      errors.push(`Invalid resources for ${country.id}`);
    }

    if (!country.lastUpdated) {
      errors.push(`Missing lastUpdated for ${country.id}`);
    }
  });

  return {
    valid: errors.length === 0,
    totalCountries: countries.length,
    errors,
  };
}

// Main execution
(async () => {
  try {
    console.log("\n=== Populating all 195 countries ===\n");
    const { allCountries, preservedCount, newCount } = await populateAllCountries();

    console.log(
      `Total countries: ${allCountries.length}\n` +
        `Preserved existing data: ${preservedCount}\n` +
        `New countries added: ${newCount}`
    );

    // Validate
    const validation = validateCountries(allCountries);
    console.log(`\nValidation: ${validation.valid ? "✓ PASSED" : "✗ FAILED"}`);

    if (!validation.valid) {
      console.error("Validation errors:", validation.errors);
      process.exit(1);
    }

    // Write to file
    const outputPath = path.join(__dirname, "../public/countries-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(allCountries, null, 2));
    console.log(
      `\n✓ Successfully wrote ${allCountries.length} countries to public/countries-data.json`
    );

    // Summary statistics by region
    const regions = new Map();
    allCountries.forEach((c) => {
      regions.set(c.region, (regions.get(c.region) || 0) + 1);
    });

    console.log("\nRegional breakdown:");
    Array.from(regions.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([region, count]) => {
        console.log(`  ${region}: ${count} countries`);
      });

    console.log("\n✓ Population complete!\n");
  } catch (error) {
    console.error("Error during population:", error);
    process.exit(1);
  }
})();
