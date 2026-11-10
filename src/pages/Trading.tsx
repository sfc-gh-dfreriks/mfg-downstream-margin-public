import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { Activity, TrendingUp, TrendingDown, CurrencyIcon } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const bbl = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BBL`);
const pb = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}/BBL`);

export default function Trading() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('trading', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend: any[] = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Mark-to-Market" value={formatDollar(k.mtm)} icon={CurrencyIcon} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="CTRM, all books" deltaType={Number(k.mtm) < 0 ? 'negative' : 'positive'} />
          <MetricCard title="Long" value={bbl(k.longBbl)} icon={TrendingUp} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Bought forward" deltaType="neutral" />
          <MetricCard title="Short" value={bbl(k.shortBbl)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`Net ${bbl(k.net)}`} deltaType="neutral" />
          <MetricCard title="Trades" value={formatNumber(k.trades)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Physical and paper · terminal filter n/a" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Net Position and MTM by Delivery Month" className="lg:col-span-2" subtitle="BBL and USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 70, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r) => r.month) },
              yAxis: [{ type: 'value', name: 'BBL' }, { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }],
              series: [{ name: 'Net position', type: 'bar', data: trend.map((r) => r.net), itemStyle: { color: '#a5f3fc' } },
                       { name: 'MTM', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r) => r.mtm), itemStyle: { color: '#7c3aed' } }],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="MTM by Book" subtitle="USD">
            <Bars rows={data?.byBook ?? []} label="name" value="mtm" color="#7c3aed" height={240} />
          </ChartCard>
          <ChartCard title="MTM by Price Index" subtitle="USD">
            <Bars rows={data?.byIndex ?? []} label="name" value="mtm" color="#0ea5e9" height={240} />
          </ChartCard>
          <ChartCard title="Largest Positions by MTM" subtitle="Book, product and delivery month" className="lg:col-span-2">
            <DataTable data={data?.positions ?? []} columns={[
              { key: 'book', label: 'Book' }, { key: 'material', label: 'Product' }, { key: 'idx', label: 'Index' }, { key: 'month', label: 'Delivery' },
              { key: 'longBbl', label: 'Long', format: bbl }, { key: 'shortBbl', label: 'Short', format: bbl }, { key: 'net', label: 'Net', format: bbl },
              { key: 'price', label: 'Avg price', format: pb }, { key: 'mtm', label: 'MTM', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
