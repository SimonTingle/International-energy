"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { CountryData } from "@/lib/types";
import { useDashboardStore } from "@/lib/store";

interface EnergyMapProps {
  countries: CountryData[];
}

export default function EnergyMap({ countries }: EnergyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { setSelectedCountry, selectedCountry } = useDashboardStore();

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      "pk.eyJ1IjoiZW5lcmd5LWRhc2giLCJhIjoiY201b2dqNHM2MGl2aTJqcXd1OGh2NTkzaiJ9.test";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 2,
      pitch: 0,
    });

    map.current.on("load", () => {
      setMapLoaded(true);

      // Add country markers for each country
      countries.forEach((country) => {
        const el = document.createElement("div");
        el.className = "country-marker";
        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#0ea5e9";
        el.style.cursor = "pointer";
        el.style.border = "2px solid #0f172a";
        el.style.transition = "all 0.2s ease";
        el.addEventListener("mouseenter", () => {
          el.style.width = "16px";
          el.style.height = "16px";
          el.style.backgroundColor = "#10b981";
          setSelectedCountry(country);
        });
        el.addEventListener("mouseleave", () => {
          if (selectedCountry?.id !== country.id) {
            el.style.width = "12px";
            el.style.height = "12px";
            el.style.backgroundColor = "#0ea5e9";
          }
        });

        new mapboxgl.Marker(el)
          .setLngLat(country.coordinates)
          .addTo(map.current!);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [countries, selectedCountry, setSelectedCountry]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden shadow-2xl"
    />
  );
}
