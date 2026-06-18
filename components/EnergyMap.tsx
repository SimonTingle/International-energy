"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { CountryData } from "@/lib/types";
import { useDashboardStore } from "@/lib/store";

interface Vessel {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  navStatus: number;
  sog: number;
  time: string;
  heading: number;
}

const NAV_STATUS_LABEL: Record<number, string> = {
  0: 'Under Way (Engine)',
  1: 'At Anchor',
  2: 'Not Under Command',
  3: 'Restricted Manoeuvrability',
  4: 'Constrained by Draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in Fishing',
  8: 'Under Way (Sailing)',
  15: 'Unknown',
};

interface EnergyMapProps {
  countries: CountryData[];
}

export default function EnergyMap({ countries }: EnergyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const markerColorsRef = useRef<Map<string, string>>(new Map());
  const vesselMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const { setSelectedCountry, selectedCountry } = useDashboardStore();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log("🗺️ MAP: Initializing map with OpenStreetMap tiles");
    // Initialize Leaflet map with OpenStreetMap tiles
    map.current = L.map(mapContainer.current).setView([20, 0], 2);

    // Add OpenStreetMap tiles (free, no key needed)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: "map-tiles",
    }).addTo(map.current);

    console.log(`📍 MARKERS: Loading ${countries.length} countries`);

    // Marker colors: green = live DB data, yellow = fallback/static, red = no data
    const getMarkerColor = (country: CountryData): string => {
      const hasData = Object.values(country.resources).some((v) => v > 0);
      if (!hasData) return "#ef4444"; // red
      if (country.dataSource === "database") return "#22c55e"; // green
      return "#eab308"; // yellow (fallback)
    };

    const createMarker = (country: CountryData) => {
      const fillColor = getMarkerColor(country);
      const marker = L.circleMarker(
        [country.coordinates[1], country.coordinates[0]],
        {
          radius: 6,
          fillColor,
          color: "#0f172a",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }
      );

      marker.bindPopup(`<div class="text-center">
        <p class="font-bold">${country.name}</p>
        <p class="text-xs text-gray-600">${country.region}</p>
      </div>`);

      // Mouse events for hover effect
      marker.on("mouseenter", () => {
        marker.setRadius(8);
        marker.setStyle({ fillColor: "#10b981" });
        setSelectedCountry(country);
        console.log(`🔍 HOVER: ${country.name}`, {
          region: country.region,
          coordinates: country.coordinates,
          dataSource: country.dataSource,
          timestamp: new Date().toISOString(),
        });
      });

      marker.on("mouseleave", () => {
        if (selectedCountry?.id !== country.id) {
          marker.setRadius(6);
          marker.setStyle({ fillColor: markerColorsRef.current.get(country.id) || fillColor });
        }
        console.log(`👁️ UNHOVER: ${country.name}`);
      });

      marker.on("click", () => {
        setSelectedCountry(country);
        console.log(`✓ CLICK: ${country.name}`, {
          resources: country.resources,
          total: Object.values(country.resources).reduce((a, b) => a + b, 0),
          timestamp: new Date().toISOString(),
        });
      });

      marker.addTo(map.current!);
      markersRef.current.set(country.id, marker);
      markerColorsRef.current.set(country.id, fillColor);
    };

    // Add all country markers
    countries.forEach(createMarker);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [countries, selectedCountry, setSelectedCountry]);

  // Update marker style when country is selected
  useEffect(() => {
    markersRef.current.forEach((marker, countryId) => {
      if (selectedCountry?.id === countryId) {
        marker.setRadius(8);
        marker.setStyle({ fillColor: "#10b981" });
      } else {
        marker.setRadius(6);
        marker.setStyle({ fillColor: markerColorsRef.current.get(countryId) || "#eab308" });
      }
    });
  }, [selectedCountry]);

  // Fetch and render vessel markers
  useEffect(() => {
    if (!map.current) return;

    const fetchVessels = async () => {
      try {
        const res = await fetch("/api/vessels");
        const { vessels } = await res.json();
        renderVesselMarkers(vessels);
      } catch (err) {
        console.error("Failed to fetch vessels:", err);
      }
    };

    fetchVessels();
    const interval = setInterval(fetchVessels, 3600000); // Refresh hourly
    return () => clearInterval(interval);
  }, []);

  const renderVesselMarkers = (vessels: Vessel[]) => {
    // Clear old vessel markers
    vesselMarkersRef.current.forEach((marker) => marker.remove());
    vesselMarkersRef.current.clear();

    // Render each vessel as a rotated red triangle
    vessels.forEach((vessel) => {
      const iconHtml = `<div style="
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 8px solid #ef4444;
        transform: rotate(${vessel.heading}deg);
        filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));
      "></div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: "vessel-marker",
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });

      const marker = L.marker([vessel.lat, vessel.lon], { icon });

      const popupContent = `
        <div style="font-size: 12px;">
          <strong>${vessel.name || `MMSI ${vessel.mmsi}`}</strong><br/>
          MMSI: ${vessel.mmsi}<br/>
          Status: ${NAV_STATUS_LABEL[vessel.navStatus] || 'Unknown'}<br/>
          Speed: ${vessel.sog.toFixed(1)} knots<br/>
          Heading: ${vessel.heading}°<br/>
          <a href="https://www.marinetraffic.com/en/ais/details/ships/mmsi:${vessel.mmsi}" target="_blank" rel="noopener noreferrer" style="color: #0ea5e9;">View on MarineTraffic</a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map.current!);
      vesselMarkersRef.current.set(vessel.mmsi, marker);
    });

    console.log(`🚢 VESSELS: Rendered ${vessels.length} vessel markers`);
  };

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden shadow-2xl"
      style={{ background: "#1e293b" }}
    />
  );
}
