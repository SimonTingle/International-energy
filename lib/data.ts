import { CountryData } from "./types";

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function getResourceLabel(resource: string): string {
  const labels: Record<string, string> = {
    oil: "Oil",
    gas: "Natural Gas",
    coal: "Coal",
    diesel: "Diesel",
    renewables: "Renewables",
    nuclear: "Nuclear",
  };
  return labels[resource] || resource;
}

export function getResourceUnit(resource: string): string {
  const units: Record<string, string> = {
    oil: "Billion Barrels",
    gas: "Trillion Cubic Feet",
    coal: "Billion Tons",
    diesel: "Billion Barrels",
    renewables: "GW",
    nuclear: "GW",
  };
  return units[resource] || "";
}

export function getResourceColor(resource: string): string {
  const colors: Record<string, string> = {
    oil: "#f59e0b",
    gas: "#3b82f6",
    coal: "#6b7280",
    diesel: "#8b5cf6",
    renewables: "#10b981",
    nuclear: "#ef4444",
  };
  return colors[resource] || "#9ca3af";
}

export async function searchCountries(
  query: string,
  countries: CountryData[]
): Promise<CountryData[]> {
  const lowerQuery = query.toLowerCase();
  return countries.filter(
    (country) =>
      country.name.toLowerCase().includes(lowerQuery) ||
      country.id.toLowerCase().includes(lowerQuery)
  );
}
