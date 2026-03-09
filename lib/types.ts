export interface EnergyResources {
  oil: number; // billion barrels
  gas: number; // trillion cubic feet
  coal: number; // billion tons
  diesel: number; // billion barrels
  renewables: number; // GW capacity
  nuclear: number; // GW capacity
}

export interface CountryData {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  resources: EnergyResources;
  lastUpdated: string;
  region: string;
}

export interface CountryStats {
  total: number;
  byResource: Record<string, number>;
}

export interface PanelState {
  selectedCountry: CountryData | null;
  isExpanded: boolean;
}
