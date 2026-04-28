import { useQuery } from '@tanstack/react-query';
import { Server, Ticket, AlertTriangle, Activity, TrendingUp, Clock } from 'lucide-react';
import { assetsApi } from '../api/assets';
import { ticketsApi } from '../api/tickets';
import { sensorsApi } from '../api/sensors';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ticketStatusColors, ticketStatusLabel, formatRelative, formatRms } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
}

function KpiCard({ label, value, icon, iconBg, trend, trendUp }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.getAll,
  });

  const { data: sensors, isLoading: loadingSensors } = useQuery({
    queryKey: ['sensors'],
    queryFn: sensorsApi.getAll,
  });

  const { data: openCount, isLoading: loadingCount } = useQuery({
    queryKey: ['tickets', 'count'],
    queryFn: ticketsApi.countOpen,
    refetchInterval: 30000,
  });

  const { data: activeTickets, isLoading: loadingActive } = useQuery({
    queryKey: ['tickets', 'active'],
    queryFn: ticketsApi.getActive,
    refetchInterval: 30000,
  });

  const { data: violations, isLoading: loadingViolations } = useQuery({
    queryKey: ['assets', 'violations'],
    queryFn: assetsApi.getViolations,
    refetchInterval: 60000,
  });

  const { data: avgRms, isLoading: loadingAvgRms } = useQuery({
    queryKey: ['assets', 'avg-rms'],
    queryFn: assetsApi.getAvgRms,
  });

  // Aggregate avg RMS chart data — latest reading per asset
  const chartData = (() => {
    if (!avgRms) return [];
    const map: Record<string, { asset: string; avgRms: number; count: number }> = {};
    avgRms.forEach(row => {
      if (!map[row.assetName]) map[row.assetName] = { asset: row.assetName, avgRms: 0, count: 0 };
      map[row.assetName].avgRms += row.averageRms;
      map[row.assetName].count  += 1;
    });
    return Object.values(map).map(r => ({ asset: r.asset, avgRms: +(r.avgRms / r.count).toFixed(2) }));
  })();

  const activeSensors = sensors?.filter(s => s.active).length ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingAssets ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total Assets"
              value={assets?.length ?? 0}
              icon={<Server className="w-5 h-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <KpiCard
              label="Active Sensors"
              value={activeSensors}
              icon={<Activity className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
            />
            <KpiCard
              label="Open Tickets"
              value={loadingCount ? '…' : (openCount?.openTickets ?? 0)}
              icon={<Ticket className="w-5 h-5 text-red-500" />}
              iconBg="bg-red-50"
              trend={openCount?.openTickets ? `${openCount.openTickets} need attention` : undefined}
              trendUp={false}
            />
            <KpiCard
              label="Violations (24h)"
              value={violations?.length ?? 0}
              icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-50"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Avg RMS chart */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader
              title="Average RMS per Asset"
              subtitle="Last 30 days — vibration intensity"
              action={<TrendingUp className="w-4 h-4 text-slate-400" />}
            />
            {loadingAvgRms ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState title="No reading data yet" description="Publish some readings to see the chart" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: -10, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="asset" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(v: number) => [`${v} mm/s`, 'Avg RMS']}
                  />
                  <Bar dataKey="avgRms" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Violations list */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Assets with Violations"
              subtitle="Threshold breaches in last 24h"
              action={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            />
            {loadingViolations ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (violations?.length ?? 0) === 0 ? (
              <EmptyState title="All clear" description="No violations in the last 24 hours" />
            ) : (
              <ul className="space-y-2">
                {violations!.map(asset => (
                  <li key={asset.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{asset.name}</p>
                      <p className="text-xs text-slate-500">{asset.location ?? asset.assetType}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Active tickets */}
      <Card padding={false}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Active Tickets</h3>
            <p className="text-sm text-slate-500 mt-0.5">Open and in-progress maintenance work orders</p>
          </div>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        {loadingActive ? (
          <div className="p-6"><Skeleton className="h-32 w-full" /></div>
        ) : (activeTickets?.length ?? 0) === 0 ? (
          <EmptyState title="No active tickets" description="All maintenance is up to date" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Asset</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Sensor</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeTickets!.slice(0, 8).map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{ticket.assetName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{ticket.sensorName}</td>
                    <td className="px-4 py-3.5">
                      <Badge label={ticketStatusLabel[ticket.status]} className={ticketStatusColors[ticket.status]} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{ticket.description}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{formatRelative(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
