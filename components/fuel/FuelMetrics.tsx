'use client';

interface MetricCardProps {
  label: string;
  value: string | null;
  unit?: string;
  sub?: string;
  color?: string;
  loading?: boolean;
}

function MetricCard({ label, value, unit, sub, color = 'text-amber-400', loading }: MetricCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      {loading ? (
        <div className="h-7 w-24 bg-slate-700 rounded animate-pulse" />
      ) : (
        <span className={`text-2xl font-bold ${color}`}>
          {value ?? '—'}
          {value && unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
        </span>
      )}
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

interface USStocks {
  value: number;
  period: string;
  unit: string;
  source: string;
}

interface FuelPrice {
  value: number;
  period: string;
  unit: string;
  source: string;
}

interface BrentCrude {
  value: number;
  period: string;
  unit: string;
  source: string;
}

export interface FuelMetricsData {
  crude_stocks?: USStocks;
  gasoline_stocks?: USStocks;
  distillate_stocks?: USStocks;
  gasoline_price?: FuelPrice;
  diesel_price?: FuelPrice;
  crude_reserves?: { value: number; period: string; unit: string; source: string };
  crude_production?: { value: number; period: string; unit: string; source: string };
  brent_crude?: BrentCrude;
  rp_ratio_years?: number;
  rp_source?: string;
  intl_production?: { value: number; period: string; unit: string; countryName: string };
  intl_reserves?: { value: number; period: string; unit: string; countryName: string };
}

interface Props {
  data: FuelMetricsData | null;
  loading?: boolean;
  isUS?: boolean;
}

function fmt(n: number | undefined, decimals = 0): string | null {
  if (n == null || isNaN(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export default function FuelMetrics({ data, loading, isUS }: Props) {
  const d = data;
  return (
    <div className="space-y-4">
      {/* Brent crude always shown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Brent Crude"
          value={fmt(d?.brent_crude?.value, 2)}
          unit="$/bbl"
          sub={d?.brent_crude?.period ?? undefined}
          color="text-orange-400"
          loading={loading}
        />
        <MetricCard
          label="R/P Ratio"
          value={d?.rp_ratio_years != null ? String(d.rp_ratio_years) : null}
          unit="years"
          sub="Reserves ÷ Production"
          color={
            d?.rp_ratio_years == null ? 'text-slate-400' :
            d.rp_ratio_years < 20 ? 'text-red-400' :
            d.rp_ratio_years < 50 ? 'text-yellow-400' : 'text-green-400'
          }
          loading={loading}
        />
        <MetricCard
          label={isUS ? 'US Crude Reserves' : 'Oil Reserves'}
          value={fmt(isUS ? d?.crude_reserves?.value : d?.intl_reserves?.value, 0)}
          unit={isUS ? 'M bbl' : 'B bbl'}
          sub={isUS ? d?.crude_reserves?.period ?? undefined : d?.intl_reserves?.period ?? undefined}
          color="text-blue-400"
          loading={loading}
        />
        <MetricCard
          label={isUS ? 'US Production' : 'Production'}
          value={fmt(isUS ? d?.crude_production?.value : d?.intl_production?.value, 0)}
          unit={isUS ? 'kbd' : 'kbd'}
          sub={isUS ? d?.crude_production?.period ?? undefined : d?.intl_production?.period ?? undefined}
          color="text-emerald-400"
          loading={loading}
        />
      </div>

      {/* US-specific weekly stocks */}
      {isUS && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard
            label="US Crude Stocks"
            value={fmt(d?.crude_stocks?.value, 0)}
            unit="k bbl"
            sub={d?.crude_stocks?.period ?? undefined}
            color="text-amber-400"
            loading={loading}
          />
          <MetricCard
            label="Gasoline Stocks"
            value={fmt(d?.gasoline_stocks?.value, 0)}
            unit="k bbl"
            sub={d?.gasoline_stocks?.period ?? undefined}
            color="text-purple-400"
            loading={loading}
          />
          <MetricCard
            label="Distillate Stocks"
            value={fmt(d?.distillate_stocks?.value, 0)}
            unit="k bbl"
            sub={d?.distillate_stocks?.period ?? undefined}
            color="text-pink-400"
            loading={loading}
          />
        </div>
      )}

      {/* US pump prices */}
      {isUS && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="US Gasoline Price"
            value={fmt(d?.gasoline_price?.value, 3)}
            unit="$/gal"
            sub={d?.gasoline_price?.period ?? undefined}
            color="text-yellow-300"
            loading={loading}
          />
          <MetricCard
            label="US Diesel Price"
            value={fmt(d?.diesel_price?.value, 3)}
            unit="$/gal"
            sub={d?.diesel_price?.period ?? undefined}
            color="text-cyan-300"
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
