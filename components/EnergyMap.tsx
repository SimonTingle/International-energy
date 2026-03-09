"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { CountryData } from "@/lib/types";
import { useDashboardStore } from "@/lib/store";

interface EnergyMapProps {
  countries: CountryData[];
}

export default function EnergyMap({ countries }: EnergyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
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

    // Create custom icon for markers
    const createMarker = (country: CountryData) => {
      const marker = L.circleMarker(
        [country.coordinates[1], country.coordinates[0]],
        {
          radius: 6,
          fillColor: "#0ea5e9",
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
          timestamp: new Date().toISOString(),
        });
      });

      marker.on("mouseleave", () => {
        if (selectedCountry?.id !== country.id) {
          marker.setRadius(6);
          marker.setStyle({ fillColor: "#0ea5e9" });
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
        marker.setStyle({ fillColor: "#0ea5e9" });
      }
    });
  }, [selectedCountry]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden shadow-2xl"
      style={{ background: "#1e293b" }}
    />
  );
}
