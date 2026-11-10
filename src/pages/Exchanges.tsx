import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { Activity, TrendingDown, Users, CurrencyIcon } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const bbl = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BBL`);
const pct = (v: any) => (v == null ? '–' : `${Number(v).toFixed(2)}%`);
const COLORS = ['#0f766e', '#7c3aed', '#f59e0b', '#0ea5e9', '#ef4444', '#64748b', '#10b981'];

export default function Exchanges() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('exchanges', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend: any[] = data?.trend ?? [];
  const months = [...new Set(trend.map((r) => r.month))];
  const names = [...new Set(trend.map((r) => r.partner))].sort();
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Exchange Receipts" value={bbl(k.receipts)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${bbl(k.deliveries)} delivered`} deltaType="neutral" />
          <MetricCard title="Net Imbalance" value={bbl(k.balance)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="Receipts minus deliveries: barrels to return" deltaType="negative" />
          <MetricCard title="Differential Fees" value={formatDollar(k.fees)} icon={CurrencyIcon} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Location and grade differentials" deltaType="neutral" />
          <MetricCard title="Counterparties" value={formatNumber(k.partners)} icon={Users} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatNumber(k.exchanges)} exchange agreements · terminal filter n/a`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Monthly Balance by Counterparty" subtitle="BBL, receipts minus deliveries; above zero = counterparty short" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: months }, yAxis: { type: 'value', name: 'BBL' },
              series: names.map((n, i) => ({ name: n, type: 'bar', itemStyle: { color: n.startsWith('P004') ? '#ef4444' : COLORS[i % COLORS.length] },
                data: months.map((m) => trend.find((r) => r.month === m && r.partner === n)?.balance ?? null) })),
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Net Imbalance by Counterparty" subtitle="BBL, largest first">
            <Bars rows={data?.byPartner ?? []} label="name" value="balance" color="#ef4444" height={260} leftPad={200} format={bbl} />
          </ChartCard>
          <ChartCard title="Counterparty Balances" subtitle="Per exchange period">
            <DataTable data={data?.byPartner ?? []} columns={[
              { key: 'name', label: 'Counterparty' }, { key: 'periods', label: 'Periods', format: formatNumber }, { key: 'avgBalance', label: 'Avg', format: bbl },
              { key: 'minBalance', label: 'Min', format: bbl }, { key: 'maxBalance', label: 'Max', format: bbl },
              { key: 'shortPct', label: '% periods short', format: pct }, { key: 'fees', label: 'Fees', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
