import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Activity, TrendingDown, Gauge } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const bbl = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BBL`);
const pb = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}/BBL`);
const pct = (v: any) => (v == null ? '–' : `${Number(v).toFixed(2)}%`);

export default function Overview() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const leak = (data?.leakage ?? []).reduce((s: number, r: any) => s + (r.value ?? 0), 0);
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Rack Revenue" value={formatDollar(k.revenue)} icon={CurrencyIcon} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50"
            delta={`${bbl(k.volume)} sold or received`} deltaType="neutral" />
          <MetricCard title="Net Margin" value={formatDollar(k.margin)} icon={Gauge} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50"
            delta={`${pb(k.marginBbl)} after crude, transport, handling and exchange fees`} deltaType={Number(k.margin) < 0 ? 'negative' : 'neutral'} />
          <MetricCard title="QCI Volume Loss" value={bbl(k.qciLossBbl)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50"
            delta={`${pct(k.qciPct)} of gross receipts lost to net@15°C`} deltaType="negative" />
          <MetricCard title="Margin Leaking" value={formatDollar(leak)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50"
            delta={`CTRM mark-to-market ${formatDollar(k.mtm)}`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Rack Revenue and Margin per BBL by Month" className="lg:col-span-2" subtitle="Margin waterfall mart: revenue less crude cost, transport, handling and exchange fees">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: '$/BBL' }],
              series: [
                { name: 'Rack revenue', type: 'bar', data: trend.map((r: any) => r.revenue), itemStyle: { color: '#a5f3fc' } },
                { name: 'Margin $/BBL', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.marginBbl?.toFixed?.(2)), itemStyle: { color: '#7c3aed' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Where Margin Is Leaking" subtitle="USD, largest first: QCI loss at receipt cost, rack discounts, exchange imbalance at crude rack price, exchange fees">
            <Bars rows={data?.leakage ?? []} label="name" value="value" color="#ef4444" height={280} leftPad={220} />
          </ChartCard>
          <ChartCard title="QCI Loss by Terminal" subtitle="% of gross receipts lost between nominated and net@15°C volume">
            <Bars rows={data?.qciByTerminal ?? []} label="name" value="pct" color="#f59e0b" height={280} format={pct} />
          </ChartCard>
          <ChartCard title="Rack Revenue by Terminal" subtitle="USD">
            <Bars rows={data?.byTerminal ?? []} label="name" value="revenue" color="#29b5e8" height={260} />
          </ChartCard>
          <ChartCard title="Net Margin by Terminal" subtitle="USD; crude cost is taken on receipts, so terminals that receive more than they sell show negative">
            <Bars rows={data?.byTerminal ?? []} label="name" value="margin" color="#7c3aed" height={260} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
