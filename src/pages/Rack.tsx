import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, TrendingDown, Gauge, Activity } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';

const bbl = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BBL`);
const pb = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}/BBL`);
const COLORS = ['#0f766e', '#7c3aed', '#f59e0b', '#0ea5e9', '#ef4444', '#64748b', '#10b981'];
const dpb = (v: any) => (v == null ? '–' : `${Number(v) < 0 ? '−' : '+'}$${Math.abs(Number(v)).toFixed(3)}`);

export default function Rack() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('rack', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend: any[] = data?.trend ?? [];
  const months = [...new Set(trend.map((r) => r.month))];
  const lines = [...new Set(trend.map((r) => r.line))].sort();
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Realized Rack Price" value={pb(k.realized)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${bbl(k.qty)} · ${formatNumber(k.txns)} billing items`} deltaType="neutral" />
          <MetricCard title="vs Benchmark" value={`${dpb(k.discount)}/BBL`} icon={Gauge} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Realized minus the WTI + crack rack benchmark" deltaType={Number(k.discount) < 0 ? 'negative' : 'positive'} />
          <MetricCard title="Sold Below Benchmark" value={formatDollar(k.belowUsd)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.belowMonths)} terminal-product-months below`} deltaType="negative" />
          <MetricCard title="Rack Revenue" value={formatDollar(k.value)} icon={Activity} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Net billing value" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Realized vs Benchmark by Month" subtitle="$/BBL by terminal and product; below zero = sold under benchmark (T300 Houston Gasoline highlighted)" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0, type: 'scroll' }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: months }, yAxis: { type: 'value', name: '$/BBL' },
              series: lines.map((n, i) => ({ name: n, type: 'line', smooth: true, itemStyle: { color: COLORS[i % COLORS.length] },
                lineStyle: { width: n.startsWith('T300') && n.endsWith('Gasoline') ? 3.5 : 1.2 },
                data: months.map((m) => trend.find((r) => r.month === m && r.line === n)?.discount?.toFixed?.(3) ?? null) })),
            }} style={{ height: 340 }} />
          </ChartCard>
          <ChartCard title="Price vs Benchmark by Terminal and Product" subtitle="Furthest below benchmark first">
            <DataTable data={data?.byLine ?? []} columns={[
              { key: 'terminal', label: 'Terminal' }, { key: 'material', label: 'Product' }, { key: 'qty', label: 'Volume', format: bbl },
              { key: 'realized', label: 'Realized', format: pb }, { key: 'benchmark', label: 'Benchmark', format: pb },
              { key: 'discount', label: 'vs bench', format: dpb }, { key: 'discountUsd', label: 'USD', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Worst Months Below Benchmark" subtitle="Terminal-product-months">
            <DataTable data={data?.worstMonths ?? []} columns={[
              { key: 'month', label: 'Month' }, { key: 'terminal', label: 'Terminal' }, { key: 'material', label: 'Product' },
              { key: 'realized', label: 'Realized', format: pb }, { key: 'benchmark', label: 'Benchmark', format: pb },
              { key: 'discount', label: 'vs bench', format: dpb }, { key: 'discountUsd', label: 'USD', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
