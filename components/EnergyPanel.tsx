"use client";

import { useState } from "react";
import { useDashboardStore } from "@/lib/store";
import {
  formatNumber,
  getResourceColor,
  getResourceLabel,
  getResourceUnit,
} from "@/lib/data";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function EnergyPanel() {
  const [showDebug, setShowDebug] = useState(false);
  const {
    selectedCountry,
    isExpanded,
    setIsExpanded,
    toggleExpanded,
    reset,
  } = useDashboardStore();

  if (!selectedCountry) {
    return (
      <div className="absolute bottom-8 right-8 bg-slate-800 rounded-lg p-6 shadow-2xl border border-slate-700 max-w-xs">
        <p className="text-slate-400 text-sm">
          Hover over a country marker to view energy resources
        </p>
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-y-0 right-0 bg-slate-800 border-l border-slate-700 shadow-2xl transition-all duration-300 flex flex-col z-50 ${
        isExpanded ? "w-96" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="bg-slate-900 p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{selectedCountry.name}</h2>
          <p className="text-slate-400 text-sm">{selectedCountry.region}</p>
        </div>
        <button
          onClick={() => {
            console.log(`❌ CLOSE: Panel closed for ${selectedCountry.name}`);
            reset();
          }}
          className="text-slate-400 hover:text-white transition-colors p-2"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Energy Resources
          </h3>
          <div className="space-y-3">
            {Object.entries(selectedCountry.resources).map(([key, value]) => {
              if (value === 0) return null;
              const label = getResourceLabel(key);
              const unit = getResourceUnit(key);
              const color = getResourceColor(key);

              return (
                <div
                  key={key}
                  className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-white font-medium">{label}</span>
                    </div>
                    <span className="text-slate-300 text-sm">{unit}</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(value)}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        backgroundColor: color,
                        width: `${Math.min((value / 1000) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-700">
          Last updated: {new Date(selectedCountry.lastUpdated).toLocaleDateString()}
        </div>

        {/* Debug Section */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="w-full text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>🐛 Debug Info</span>
              <span>{showDebug ? "▼" : "▶"}</span>
            </button>
            {showDebug && (
              <div className="mt-3 space-y-2 text-xs text-slate-400 bg-slate-700 rounded p-3 font-mono">
                <div>
                  <span className="text-slate-500">ID:</span> {selectedCountry.id}
                </div>
                <div>
                  <span className="text-slate-500">Lat/Lng:</span> {selectedCountry.coordinates[1].toFixed(4)}, {selectedCountry.coordinates[0].toFixed(4)}
                </div>
                <div>
                  <span className="text-slate-500">Region:</span> {selectedCountry.region}
                </div>
                <div>
                  <span className="text-slate-500">Resources:</span>
                  <div className="mt-1 ml-2 space-y-1">
                    {Object.entries(selectedCountry.resources).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Expanded:</span> {isExpanded ? "true" : "false"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle Expand Button */}
      <div className="border-t border-slate-700 p-4 bg-slate-900">
        <button
          onClick={() => {
            console.log(`${isExpanded ? "⬅️ COLLAPSE" : "➡️ EXPAND"}: Details panel for ${selectedCountry.name}`);
            toggleExpanded();
          }}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronRightIcon className="w-4 h-4" />
              Collapse
            </>
          ) : (
            <>
              <ChevronLeftIcon className="w-4 h-4" />
              Expand
            </>
          )}
        </button>
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="absolute right-full top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-700 p-6 overflow-y-auto z-40">
          <h3 className="text-lg font-semibold text-white mb-6">
            Detailed Analysis
          </h3>

          {/* Statistics */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-4">
                Resource Distribution
              </h4>
              {Object.entries(selectedCountry.resources).map(([key, value]) => {
                if (value === 0) return null;
                const label = getResourceLabel(key);
                const color = getResourceColor(key);
                const total = Object.values(
                  selectedCountry.resources
                ).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);

                return (
                  <div key={key} className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">{label}</span>
                      <span className="text-slate-400 text-xs">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          backgroundColor: color,
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Resources */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">Total Resources</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(
                  Object.values(selectedCountry.resources).reduce(
                    (a, b) => a + b,
                    0
                  )
                )}
              </p>
            </div>

            {/* Quick Facts */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">
                Quick Facts
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  {selectedCountry.resources.renewables > 0
                    ? "Renewable energy available"
                    : "Limited renewable capacity"}
                </li>
                <li>
                  {selectedCountry.resources.nuclear > 0
                    ? "Nuclear power operational"
                    : "No nuclear infrastructure"}
                </li>
                <li>
                  {selectedCountry.resources.oil > 0
                    ? `Major oil reserves: ${formatNumber(selectedCountry.resources.oil)} BB`
                    : "Limited oil reserves"}
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={toggleExpanded}
            className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ChevronRightIcon className="w-4 h-4" />
            Collapse Details
          </button>
        </div>
      )}
    </div>
  );
}
