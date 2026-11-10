import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import MetricCard, { Activity, Building2, FileText } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function Coverage() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('coverage', apiCompanies, apiCategories), deps);
  const rows: any[] = data?.rows ?? [];
  const total = rows.reduce((s, r) => s + Number(r.rowCount ?? 0), 0);
  const gaps = rows.filter((r) => r.status !== 'SUPPLIED').length;
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard title="Rows Unified" value={formatNumber(total)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Across all canonical objects" deltaType="neutral" />
          <MetricCard title="Objects" value={formatNumber(new Set(rows.map((r) => r.object)).size)} icon={FileText} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatNumber(gaps)} object-source gaps`} deltaType={gaps ? 'negative' : 'neutral'} />
          <MetricCard title="Sources" value={formatNumber(new Set(rows.map((r) => r.slot)).size)} icon={Building2} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Slots supplying data in the current selection" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Rows by Canonical Object" subtitle="Gold source coverage (not affected by the sidebar filters)">
            <Bars rows={data?.byObject ?? []} label="name" value="value" color="#29b5e8" height={260} format={formatNumber} />
          </ChartCard>
          <ChartCard title="Rows by Source Slot" subtitle="SAP A, SAP B, CTRM, market prices">
            <Bars rows={data?.bySlot ?? []} label="name" value="value" color="#7c3aed" height={260} format={formatNumber} />
          </ChartCard>
          <ChartCard title="Coverage by Object and Source" className="lg:col-span-2">
            <DataTable data={rows} columns={[
              { key: 'object', label: 'Object' }, { key: 'slot', label: 'Slot' }, { key: 'system', label: 'Source system' },
              { key: 'rowCount', label: 'Rows', format: formatNumber }, { key: 'status', label: 'Status' }, { key: 'gap', label: 'Gap reason', format: (v) => v ?? '' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
