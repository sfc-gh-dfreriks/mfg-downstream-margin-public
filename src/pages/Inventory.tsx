import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { Activity, TrendingDown, Gauge, FileText } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';

const bbl = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BBL`);
const pct = (v: any) => (v == null ? '–' : `${Number(v).toFixed(2)}%`);
const COLORS = ['#0f766e', '#7c3aed', '#f59e0b', '#0ea5e9', '#ef4444', '#64748b', '#10b981'];

export default function Inventory() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('inventory', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const mv = data?.movements ?? {};
  const trend: any[] = data?.trend ?? [];
  const months = [...new Set(trend.map((r) => r.month))];
  const names = [...new Set(trend.map((r) => r.terminal))].sort();
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Gross Receipts" value={bbl(k.gross)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.receipts)} receipts (movement 101)`} deltaType="neutral" />
          <MetricCard title="Net @ 15°C" value={bbl(k.net)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${bbl(mv.issued)} issued (movement 201)`} deltaType="neutral" />
          <MetricCard title="QCI Loss" value={bbl(k.qci)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${pct(k.qciPct)} of gross receipts`} deltaType="negative" />
          <MetricCard title="Avg Temperature" value={mv.temp == null ? '–' : `${Number(mv.temp).toFixed(1)} °C`} icon={FileText} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Observed at measurement (OIB_IM)" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="QCI Loss % by Month and Terminal" subtitle="Gross receipts minus net@15°C, % of gross" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: months }, yAxis: { type: 'value', name: '%' },
              series: names.map((n, i) => ({ name: n, type: 'line', smooth: true, itemStyle: { color: COLORS[i % COLORS.length] },
                data: months.map((m) => trend.find((r) => r.month === m && r.terminal === n)?.pct?.toFixed?.(2) ?? null) })),
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Gains and Losses by Terminal and Product" subtitle="Ranked by QCI loss %">
            <DataTable data={data?.byLine ?? []} columns={[
              { key: 'terminal', label: 'Terminal' }, { key: 'material', label: 'Product' }, { key: 'gross', label: 'Gross', format: bbl },
              { key: 'net', label: 'Net @15°C', format: bbl }, { key: 'qci', label: 'QCI loss', format: bbl }, { key: 'pct', label: 'Loss %', format: pct },
            ]} />
          </ChartCard>
          <ChartCard title="Largest Receipt Losses" subtitle="Single receipts, by QCI %">
            <DataTable data={data?.worst ?? []} columns={[
              { key: 'doc', label: 'Material doc' }, { key: 'date', label: 'Posted' }, { key: 'terminal', label: 'Terminal' }, { key: 'material', label: 'Product' },
              { key: 'gross', label: 'Gross', format: bbl }, { key: 'qci', label: 'Loss', format: bbl }, { key: 'pct', label: '%', format: pct },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
