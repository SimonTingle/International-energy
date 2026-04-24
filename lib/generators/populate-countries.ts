import fs from "fs";
import path from "path";
import axios from "axios";
import { CountryData, EnergyResources } from "@/lib/types";

// ISO 3-letter to 2-letter code mapping
export const ISO3_TO_ISO2: Record<string, string> = {
  ABW: "AW",
  AFG: "AF",
  AGO: "AO",
  AIA: "AI",
  ALA: "AX",
  ALB: "AL",
  AND: "AD",
  ATG: "AG",
  ARG: "AR",
  ARM: "AM",
  ASM: "AS",
  ATA: "AQ",
  ATF: "TF",
  ATB: "AT",
  AUS: "AU",
  AUT: "AT",
  AZE: "AZ",
  BHS: "BS",
  BHR: "BH",
  BGD: "BD",
  BRB: "BB",
  BLR: "BY",
  BEL: "BE",
  BLZ: "BZ",
  BEN: "BJ",
  BMU: "BM",
  BTN: "BT",
  BOL: "BO",
  BES: "BQ",
  BIH: "BA",
  BWA: "BW",
  BRA: "BR",
  IOT: "IO",
  BRN: "BN",
  BGR: "BG",
  BFA: "BF",
  BDI: "BI",
  KHM: "KH",
  CMR: "CM",
  CAN: "CA",
  CPV: "CV",
  CAY: "KY",
  CAF: "CF",
  TCD: "TD",
  CHL: "CL",
  CHN: "CN",
  CXR: "CX",
  CCK: "CC",
  COL: "CO",
  COM: "KM",
  COG: "CG",
  COK: "CK",
  CRI: "CR",
  HRV: "HR",
  CUB: "CU",
  CUW: "CW",
  CYP: "CY",
  CZE: "CZ",
  DNK: "DK",
  DJI: "DJ",
  DMA: "DM",
  DOM: "DO",
  ECU: "EC",
  EGY: "EG",
  SLV: "SV",
  GNQ: "GQ",
  ERI: "ER",
  EST: "EE",
  ETH: "ET",
  FLK: "FK",
  FRO: "FO",
  FJI: "FJ",
  FIN: "FI",
  FRA: "FR",
  GUF: "GF",
  PYF: "PF",
  GAB: "GA",
  GMB: "GM",
  GEO: "GE",
  DEU: "DE",
  GHA: "GH",
  GIB: "GI",
  GRC: "GR",
  GRL: "GL",
  GRD: "GD",
  GLP: "GP",
  GUM: "GU",
  GTM: "GT",
  GGY: "GG",
  GIN: "GN",
  GNB: "GW",
  GUY: "GY",
  HTI: "HT",
  HMD: "HM",
  VAT: "VA",
  HND: "HN",
  HKG: "HK",
  HUN: "HU",
  ISL: "IS",
  IND: "IN",
  IDN: "ID",
  IRN: "IR",
  IRQ: "IQ",
  IRL: "IE",
  IMN: "IM",
  ISR: "IL",
  ITA: "IT",
  CIV: "CI",
  JAM: "JM",
  JPN: "JP",
  JEY: "JE",
  JOR: "JO",
  KAZ: "KZ",
  KEN: "KE",
  KIR: "KI",
  PRK: "KP",
  KOR: "KR",
  KWT: "KW",
  KGZ: "KG",
  LAO: "LA",
  LVA: "LV",
  LBN: "LB",
  LSO: "LS",
  LBR: "LR",
  LBY: "LY",
  LIE: "LI",
  LTU: "LT",
  LUX: "LU",
  MAC: "MO",
  MKD: "MK",
  MDG: "MG",
  MWI: "MW",
  MYS: "MY",
  MDV: "MV",
  MLI: "ML",
  MLT: "MT",
  MHL: "MH",
  MTQ: "MQ",
  MRT: "MR",
  MUS: "MU",
  MYT: "YT",
  MEX: "MX",
  FSM: "FM",
  MDA: "MD",
  MCO: "MC",
  MNG: "MN",
  MNE: "ME",
  MAR: "MA",
  MOZ: "MZ",
  MMR: "MM",
  NAM: "NA",
  NRU: "NR",
  NPL: "NP",
  NLD: "NL",
  NCL: "NC",
  NZL: "NZ",
  NIC: "NI",
  NER: "NE",
  NGA: "NG",
  NIU: "NU",
  NFK: "NF",
  MNP: "MP",
  NOR: "NO",
  OMN: "OM",
  PAK: "PK",
  PLW: "PW",
  PSE: "PS",
  PAN: "PA",
  PNG: "PG",
  PRY: "PY",
  PER: "PE",
  PHL: "PH",
  PCN: "PN",
  POL: "PL",
  PRT: "PT",
  PRI: "PR",
  QAT: "QA",
  REU: "RE",
  ROU: "RO",
  RUS: "RU",
  RWA: "RW",
  BLM: "BL",
  SHN: "SH",
  KNA: "KN",
  LCA: "LC",
  MAF: "MF",
  SPM: "PM",
  VCT: "VC",
  WSM: "WS",
  SMR: "SM",
  STP: "ST",
  SAU: "SA",
  SEN: "SN",
  SRB: "RS",
  SYC: "SC",
  SLE: "SL",
  SGP: "SG",
  SXM: "SX",
  SVK: "SK",
  SVN: "SI",
  SLB: "SB",
  SOM: "SO",
  ZAF: "ZA",
  SGS: "GS",
  SSD: "SS",
  ESP: "ES",
  LKA: "LK",
  SDN: "SD",
  SUR: "SR",
  SJM: "SJ",
  SWZ: "SZ",
  SWE: "SE",
  CHE: "CH",
  SYR: "SY",
  TWN: "TW",
  TJK: "TJ",
  TZA: "TZ",
  THA: "TH",
  TLS: "TL",
  TGO: "TG",
  TKL: "TK",
  TON: "TO",
  TTO: "TT",
  TUN: "TN",
  TUR: "TR",
  TKM: "TM",
  TCA: "TC",
  TUV: "TV",
  UGA: "UG",
  UKR: "UA",
  ARE: "AE",
  GBR: "GB",
  USA: "US",
  URY: "UY",
  UZB: "UZ",
  VUT: "VU",
  VEN: "VE",
  VNM: "VN",
  VGB: "VG",
  VIR: "VI",
  WLF: "WF",
  ESH: "EH",
  YEM: "YE",
  ZMB: "ZM",
  ZWE: "ZW",
};

// Load existing countries data
function loadExistingCountries(): Map<string, CountryData> {
  const existingPath = path.join(
    process.cwd(),
    "public",
    "countries-data.json"
  );
  const map = new Map<string, CountryData>();

  try {
    const data = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
    if (Array.isArray(data)) {
      data.forEach((country: CountryData) => {
        map.set(country.id, country);
      });
    }
  } catch (error) {
    console.log("No existing countries data found, starting fresh");
  }

  return map;
}

// Load countries reference
function loadCountriesReference(): any[] {
  const refPath = path.join(
    process.cwd(),
    "lib",
    "data",
    "countries-reference.json"
  );
  const data = JSON.parse(fs.readFileSync(refPath, "utf-8"));
  return data;
}

// Fetch renewable energy data from World Bank API
async function fetchWorldBankRenewables(countryCode: string): Promise<number | null> {
  try {
    const iso3Code = Object.entries(ISO3_TO_ISO2).find(
      ([_, code]) => code === countryCode
    )?.[0];

    if (!iso3Code) return null;

    const url = `https://api.worldbank.org/v2/country/${iso3Code}/indicator/EG.ELC.RNEW.ZS?format=json`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data[1] && response.data[1].length > 0) {
      const value = response.data[1][0].value;
      return value ? parseFloat(value) * 10 : null; // Convert percentage to GW estimate
    }
  } catch (error) {
    // Silently fail - will use fallback
  }

  return null;
}

// Create default resources for a country
function createDefaultResources(
  country: any,
  existingCountries: Map<string, CountryData>
): EnergyResources {
  // If country already exists with real data, return it
  if (existingCountries.has(country.id)) {
    return existingCountries.get(country.id)!.resources;
  }

  // Regional multipliers for realistic defaults
  const regionalMultipliers: Record<string, Partial<EnergyResources>> = {
    "Middle East": { oil: 50.0, gas: 100.0, coal: 5.0, diesel: 5.0, renewables: 2.0, nuclear: 0.5 },
    Africa: { oil: 10.0, gas: 20.0, coal: 50.0, diesel: 3.0, renewables: 5.0, nuclear: 0.5 },
    Europe: { oil: 5.0, gas: 50.0, coal: 30.0, diesel: 2.0, renewables: 100.0, nuclear: 20.0 },
    Asia: { oil: 20.0, gas: 80.0, coal: 200.0, diesel: 10.0, renewables: 150.0, nuclear: 30.0 },
    "North America": { oil: 40.0, gas: 200.0, coal: 150.0, diesel: 20.0, renewables: 300.0, nuclear: 80.0 },
    "South America": { oil: 10.0, gas: 30.0, coal: 5.0, diesel: 2.0, renewables: 100.0, nuclear: 5.0 },
    Oceania: { oil: 2.0, gas: 20.0, coal: 30.0, diesel: 1.0, renewables: 20.0, nuclear: 0.0 },
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
export async function populateAllCountries(): Promise<CountryData[]> {
  console.log("Starting country population process...");

  const existingCountries = loadExistingCountries();
  const countriesReference = loadCountriesReference();
  const today = new Date().toISOString().split("T")[0];

  const allCountries: CountryData[] = [];

  for (const countryRef of countriesReference) {
    let country: CountryData;

    if (existingCountries.has(countryRef.id)) {
      // Keep existing country with real data
      country = existingCountries.get(countryRef.id)!;
      allCountries.push(country);
    } else {
      // Create new country with default resources
      const resources = await createDefaultResources(countryRef, existingCountries);

      country = {
        id: countryRef.id,
        name: countryRef.name,
        coordinates: countryRef.coordinates,
        region: countryRef.region,
        resources,
        lastUpdated: today,
      };

      allCountries.push(country);
    }
  }

  return allCountries;
}

// Validate populated countries
export function validateCountries(countries: CountryData[]): {
  valid: boolean;
  totalCountries: number;
  errors: string[];
} {
  const errors: string[] = [];
  const ids = new Set<string>();

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

// No auto-execution here. To run as a script use:
//   npx ts-node scripts/run-populate-countries.ts
