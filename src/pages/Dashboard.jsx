import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Server, Ticket, AlertTriangle, Activity, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { assetsApi } from '../api/assets';
import { ticketsApi } from '../api/tickets';
import { sensorsApi } from '../api/sensors';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ticketStatusColors, ticketStatusLabel, formatRelative } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

function KpiCard({ label, value, icon, iconGradient, iconShadow, accentColor, trend, trendUp, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer group hover:scale-[1.01] transition-all duration-200"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)',
        borderTop: `3px solid ${accentColor}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">{label}</p>
          <p className="text-[34px] font-black text-slate-900 leading-none tabular-nums">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend}
            </p>
          )}
          {accent && !trend && (
            <p className="text-[11px] text-slate-400 font-medium mt-2">{accent}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: iconGradient, boxShadow: `0 4px 14px ${iconShadow}` }}
          >
            {icon}
          </div>
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#818cf8', '#7c3aed', '#a78bfa'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
    >
      <p className="font-bold text-white mb-1">{label}</p>
      <p className="text-indigo-300 font-semibold">{payload[0].value} mm/s avg RMS</p>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.getAll,
  });

  const { data: sensors } = useQuery({
    queryKey: ['sensors'],
    queryFn: sensorsApi.getAll,
  });

  const { data: openCount, isLoading: loadingCount } = useQuery({
    queryKey: ['tickets', 'count'],
    queryFn: ticketsApi.countOpen,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const { data: activeTickets, isLoading: loadingActive } = useQuery({
    queryKey: ['tickets', 'active'],
    queryFn: ticketsApi.getActive,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const { data: violations, isLoading: loadingViolations } = useQuery({
    queryKey: ['assets', 'violations'],
    queryFn: assetsApi.getViolations,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const { data: avgRms, isLoading: loadingAvgRms } = useQuery({
    queryKey: ['assets', 'avg-rms'],
    queryFn: assetsApi.getAvgRms,
    refetchInterval: 15000,
    staleTime: 0,
  });

  // Backend returns one row per sensor per asset. We take the MAX sensor avg-RMS per asset
  // rather than averaging the averages (which would be unweighted and could hide a bad sensor).
  const chartData = (() => {
    if (!avgRms) return [];
    const map = {};
    avgRms.forEach(row => {
      if (!map[row.assetName]) map[row.assetName] = { asset: row.assetName, avgRms: 0 };
      if (row.averageRms > map[row.assetName].avgRms) {
        map[row.assetName].avgRms = row.averageRms;
      }
    });
    return Object.values(map).map(r => ({ asset: r.asset, avgRms: +r.avgRms.toFixed(2) }));
  })();

  const activeSensors = sensors?.filter(s => s.active).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingAssets ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total Assets"
              value={assets?.length ?? 0}
              icon={<Server className="w-5 h-5 text-white" />}
              iconGradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
              iconShadow="rgba(99,102,241,0.40)"
              accentColor="#6366f1"
              accent="Industrial equipment units"
              onClick={() => navigate('/assets')}
            />
            <KpiCard
              label="Active Sensors"
              value={activeSensors}
              icon={<Activity className="w-5 h-5 text-white" />}
              iconGradient="linear-gradient(135deg, #10b981, #059669)"
              iconShadow="rgba(16,185,129,0.40)"
              accentColor="#10b981"
              accent="Collecting telemetry now"
              onClick={() => navigate('/sensors', { state: { activeOnly: true } })}
            />
            <KpiCard
              label="Open Tickets"
              value={loadingCount ? '—' : (openCount?.openTickets ?? 0)}
              icon={<Ticket className="w-5 h-5 text-white" />}
              iconGradient="linear-gradient(135deg, #ef4444, #dc2626)"
              iconShadow="rgba(239,68,68,0.40)"
              accentColor="#ef4444"
              trend={openCount?.openTickets ? `${openCount.openTickets} unattended` : undefined}
              trendUp={false}
              onClick={() => navigate('/tickets', { state: { statusFilter: 'OPEN' } })}
            />
            <KpiCard
              label="Violations (24h)"
              value={violations?.length ?? 0}
              icon={<AlertTriangle className="w-5 h-5 text-white" />}
              iconGradient="linear-gradient(135deg, #f59e0b, #d97706)"
              iconShadow="rgba(245,158,11,0.40)"
              accentColor="#f59e0b"
              accent="Threshold breaches detected"
              onClick={() => navigate('/assets', { state: { violationsOnly: true } })}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <Card>
            <CardHeader
              title="Avg RMS per Asset"
              subtitle="Last 30 days"
              action={
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))' }}
                >
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
              }
            />
            {loadingAvgRms ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState title="No reading data yet" description="Publish some readings to see the chart" />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={chartData} margin={{ left: -10, right: 4, top: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="asset"
                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }}
                  />
                  <Bar dataKey="avgRms" radius={[8, 8, 0, 0]} maxBarSize={56}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={`url(#barGrad${i % 3})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Assets with Violations"
              subtitle="Threshold breaches in last 24h"
              action={
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.15))', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </span>
              }
            />
            {loadingViolations ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : (violations?.length ?? 0) === 0 ? (
              <EmptyState title="All clear" description="No violations in the last 24 hours" />
            ) : (
              <ul className="space-y-2">
                {violations.map(asset => (
                  <li
                    key={asset.id}
                    onClick={() => navigate('/assets', { state: { violationsOnly: true } })}
                    className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(254,243,199,0.7), rgba(253,230,138,0.35))',
                      borderColor: 'rgba(251,191,36,0.35)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 3px 8px rgba(245,158,11,0.35)' }}
                    >
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{asset.name}</p>
                      <p className="text-xs text-amber-700 font-semibold">{asset.location ?? asset.assetType ?? 'No location'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        BREACH
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card padding={false}>
        <div
          className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(241,245,249,0.6))' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 3px 10px rgba(99,102,241,0.35)',
              }}
            >
              <Clock className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Active Tickets</h3>
              <p className="text-xs text-slate-500 font-medium">Open and in-progress maintenance work orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(activeTickets?.length ?? 0) > 0 && (
              <span
                className="text-xs font-bold text-indigo-700 px-3 py-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {activeTickets.length} active
              </span>
            )}
            <button
              onClick={() => navigate('/tickets')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loadingActive ? (
          <div className="p-6"><Skeleton className="h-32 w-full" /></div>
        ) : (activeTickets?.length ?? 0) === 0 ? (
          <EmptyState title="No active tickets" description="All maintenance is up to date" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ background: 'rgba(248,250,252,0.7)' }}>
                  {['Asset', 'Sensor', 'Status', 'Description', 'Created'].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-6 py-3.5 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeTickets.slice(0, 8).map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate('/tickets')}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        />
                        {ticket.assetName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{ticket.sensorName}</td>
                    <td className="px-6 py-4">
                      <Badge dot label={ticketStatusLabel[ticket.status]} className={ticketStatusColors[ticket.status]} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{ticket.description}</td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center justify-between gap-4">
                        {formatRelative(ticket.createdAt)}
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity flex-shrink-0" />
                      </div>
                    </td>
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
