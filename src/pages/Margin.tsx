import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { Gauge, CurrencyIcon, Activity, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';

const bbl = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BBL`);
const pb = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}/BBL`);
const PARTS = [['crude', 'Crude cost', '#fdba74'], ['transport', 'Transport', '#fca5a5'], ['handling', 'Handling', '#c4b5fd'],
               ['fees', 'Exchange fees', '#94a3b8']] as const;

export default function Margin() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('margin', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const terms: any[] = data?.byTerminal ?? [];
  const trend: any[] = data?.trend ?? [];
  // Waterfall: an invisible base bar under each cost step, running down from revenue to net margin.
  const steps: [string, number][] = [['Rack revenue', Number(k.revenue ?? 0)], ...PARTS.map(([key, name]) => [name, -Number(k[key] ?? 0)] as [string, number]),
                                     ['Net margin', Number(k.margin ?? 0)]];
  let run = 0;
  const bars = steps.map(([name, v], i) => {
    if (i === 0 || i === steps.length - 1) { run = i === 0 ? v : run; return { base: Math.min(0, v), size: Math.abs(v), name }; }
    const top = run; run += v;
    return { base: Math.min(top, run), size: Math.abs(v), name };
  });
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Margin per BBL" value={pb(k.marginBbl)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${bbl(k.volume)} volume`} deltaType="neutral" />
          <MetricCard title="Rack Revenue" value={formatDollar(k.revenue)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Net billing value, ex taxes" deltaType="neutral" />
          <MetricCard title="Crude Cost" value={formatDollar(k.crude)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`Transport ${formatDollar(k.transport)} · handling ${formatDollar(k.handling)}`} deltaType="neutral" />
          <MetricCard title="Net Margin" value={formatDollar(k.margin)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`Exchange fees ${formatDollar(k.fees)}`} deltaType={Number(k.margin) < 0 ? 'negative' : 'neutral'} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Margin Waterfall" subtitle="USD: rack revenue less each cost line">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}: ${formatDollar(steps[p[0].dataIndex][1])}` },
              grid: { left: 80, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: steps.map(([n]) => n) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', stack: 'w', data: bars.map((b) => b.base), itemStyle: { color: 'transparent' } },
                       { type: 'bar', stack: 'w', data: bars.map((b, i) => ({ value: b.size,
                         itemStyle: { color: i === 0 ? '#10b981' : i === bars.length - 1 ? '#7c3aed' : '#f87171' } })) }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Margin per BBL vs WTI Cushing" subtitle="By month">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 50, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r) => r.month) }, yAxis: [{ type: 'value', name: '$/BBL' }, { type: 'value', name: 'WTI', scale: true }],
              series: [{ name: 'Margin $/BBL', type: 'line', smooth: true, data: trend.map((r) => r.marginBbl?.toFixed?.(2)), itemStyle: { color: '#7c3aed' } },
                       { name: 'WTI Cushing', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r) => r.wti?.toFixed?.(2)), itemStyle: { color: '#94a3b8' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Revenue and Cost Lines by Terminal" subtitle="USD" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 160, right: 30, bottom: 30, top: 40 },
              yAxis: { type: 'category', inverse: true, data: terms.map((t) => t.name) }, xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ name: 'Rack revenue', type: 'bar', data: terms.map((t) => t.revenue), itemStyle: { color: '#10b981' } },
                       ...PARTS.map(([key, name, color]) => ({ name, type: 'bar', stack: 'c', data: terms.map((t) => t[key]), itemStyle: { color } }))],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Unit Economics by Terminal and Product" subtitle="Ranked by margin per BBL" className="lg:col-span-2">
            <DataTable data={data?.byLine ?? []} columns={[
              { key: 'terminal', label: 'Terminal' }, { key: 'material', label: 'Product' }, { key: 'volume', label: 'Volume', format: bbl },
              { key: 'revenue', label: 'Revenue', format: formatDollar }, { key: 'crude', label: 'Crude cost', format: formatDollar },
              { key: 'transport', label: 'Transport', format: formatDollar }, { key: 'handling', label: 'Handling', format: formatDollar },
              { key: 'fees', label: 'Exch. fees', format: formatDollar }, { key: 'margin', label: 'Net margin', format: formatDollar }, { key: 'marginBbl', label: '$/BBL', format: pb },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
