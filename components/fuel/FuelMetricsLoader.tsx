'use client';

import { useState, useEffect } from 'react';
import FuelMetrics, { type FuelMetricsData } from './FuelMetrics';

export default function FuelMetricsLoader() {
  const [data, setData] = useState<FuelMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fuel/USA')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json) setData(json as FuelMetricsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <FuelMetrics data={data} loading={loading} isUS />;
}
