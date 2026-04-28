import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { readingsApi } from '../api/readings';
import { sensorsApi } from '../api/sensors';
import { assetsApi } from '../api/assets';
import { thresholdsApi } from '../api/thresholds';
import { Card, CardHeader } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, formatRms, formatTemp } from '../utils/formatters';
import { Activity, RotateCcw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Dot,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

// ─── Custom dot — renders RED when the value exceeds the threshold ────────────

interface BreachDotProps {
  cx?: number;
  cy?: number;
  value?: number;
  threshold: number;
  color: string;
}

function BreachDot({ cx = 0, cy = 0, value = 0, threshold, color }: BreachDotProps) {
  const isBreach = value > threshold;
  if (!isBreach) return null; // only render dots on breach points
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#ef4444"
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

// ─── Readings page ────────────────────────────────────────────────────────────

const defaultFrom = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm");
const defaultTo   = format(new Date(),              "yyyy-MM-dd'T'HH:mm");

export function Readings() {
  const [assetId,  setAssetId]  = useState<number | null>(null);
  const [sensorId, setSensorId] = useState<number | null>(null);
  const [from,     setFrom]     = useState(defaultFrom);
  const [to,       setTo]       = useState(defaultTo);
  const [page,     setPage]     = useState(0);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: assets = [] }  = useQuery({ queryKey: ['assets'],  queryFn: assetsApi.getAll });
  const { data: sensors = [] } = useQuery({ queryKey: ['sensors'], queryFn: sensorsApi.getAll });

  // Sensors that belong to the selected asset (or all if none selected)
  const filteredSensors = assetId
    ? sensors.filter(s => s.assetId === assetId)
    : sensors;

  // Threshold for the selected sensor's asset — used for breach markers
  const { data: threshold } = useQuery({
    queryKey: ['threshold', 'by-asset', assetId],
    queryFn: () => thresholdsApi.getByAsset(assetId!),
    enabled: !!assetId,
  });

  // Readings — only fetch when a sensor is selected
  const { data, isLoading } = useQuery({
    queryKey: ['readings', sensorId, from, to, page],
    queryFn: () =>
      readingsApi.getPage({
        sensorId: sensorId!,
        from: from ? new Date(from).toISOString().replace('Z', '') : undefined,
        to:   to   ? new Date(to).toISOString().replace('Z', '')   : undefined,
        page,
        size: 50,
      }),
    enabled: !!sensorId,
  });

  const readings    = data?.content ?? [];
  const totalPages  = data?.page.totalPages ?? 1;
  const rmsMax      = threshold?.rmsMax  ?? null;
  const tempMax     = threshold?.tempMax ?? null;

  // Chart data — oldest first for left→right timeline
  const chartData = useMemo(() =>
    [...readings].reverse().map(r => ({
      time: format(parseISO(r.timestamp), 'dd/MM HH:mm'),
      rms:  +r.rms.toFixed(2),
      temp: +r.temperature.toFixed(1),
    })),
    [readings]
  );

  const handleReset = () => {
    setAssetId(null);
    setSensorId(null);
    setFrom(defaultFrom);
    setTo(defaultTo);
    setPage(0);
  };

  const handleAssetChange = (id: number | null) => {
    setAssetId(id);
    setSensorId(null); // reset sensor when asset changes
    setPage(0);
  };

  const handleSensorChange = (id: number | null) => {
    setSensorId(id);
    setPage(0); // reset pagination on filter change
  };

  const handleDateChange = () => {
    setPage(0); // reset pagination when date range changes
  };

  return (
    <>
      <PageHeader
        title="Readings"
        subtitle="Sensor telemetry — vibration and temperature trends"
      />

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-card">
        <div className="flex flex-wrap items-end gap-4">
          {/* Asset filter */}
          <div className="flex-1 min-w-[160px]">
            <Select
              label="Asset"
              options={assets.map(a => ({ value: String(a.id), label: a.name }))}
              placeholder="All assets"
              value={assetId ? String(assetId) : ''}
              onChange={e => handleAssetChange(e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          {/* Sensor filter */}
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Sensor"
              options={filteredSensors.map(s => ({
                value: String(s.id),
                label: assetId ? s.name : `${s.name} (${s.assetName})`,
              }))}
              placeholder="Select a sensor..."
              value={sensorId ? String(sensorId) : ''}
              onChange={e => handleSensorChange(e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          {/* Date range */}
          <div className="flex-1 min-w-[180px]">
            <Input
              label="From"
              type="datetime-local"
              value={from}
              onChange={e => { setFrom(e.target.value); handleDateChange(); }}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Input
              label="To"
              type="datetime-local"
              value={to}
              onChange={e => { setTo(e.target.value); handleDateChange(); }}
            />
          </div>

          {/* Reset */}
          <Button variant="secondary" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* Threshold info — shown when an asset with a threshold is selected */}
        {threshold && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Thresholds for {threshold.assetName}:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
              RMS max: <strong className="text-slate-700">{threshold.rmsMax} mm/s</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Temp max: <strong className="text-slate-700">{threshold.tempMax}°C</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Red dots = breach points
            </span>
          </div>
        )}
      </div>

      {!sensorId ? (
        <Card>
          <EmptyState
            icon={<Activity className="w-6 h-6" />}
            title="Select an asset and sensor"
            description="Use the filters above to choose a sensor and date range, then view its readings and trend charts"
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── Charts ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* RMS Chart */}
            <Card>
              <CardHeader
                title="RMS Vibration Trend"
                subtitle={rmsMax ? `Threshold: ${rmsMax} mm/s — red dots = breach` : 'Vibration (mm/s)'}
              />
              {isLoading ? <Skeleton className="h-56 w-full" /> :
               chartData.length === 0 ? (
                <EmptyState title="No readings in this range" description="Adjust the date range or publish some readings" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ left: -15, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: number) => [`${v} mm/s`, 'RMS']}
                    />
                    {/* Red reference line at the threshold */}
                    {rmsMax && (
                      <ReferenceLine
                        y={rmsMax}
                        stroke="#ef4444"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: `Max ${rmsMax}`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="rms"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={(props) =>
                        rmsMax ? (
                          <BreachDot
                            key={`rms-dot-${props.index}`}
                            cx={props.cx}
                            cy={props.cy}
                            value={props.value as number}
                            threshold={rmsMax}
                            color="#4f46e5"
                          />
                        ) : <></>
                      }
                      activeDot={{ r: 4, fill: '#4f46e5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Temperature Chart */}
            <Card>
              <CardHeader
                title="Temperature Trend"
                subtitle={tempMax ? `Threshold: ${tempMax}°C — red dots = breach` : 'Temperature (°C)'}
              />
              {isLoading ? <Skeleton className="h-56 w-full" /> :
               chartData.length === 0 ? (
                <EmptyState title="No readings in this range" description="Adjust the date range or publish some readings" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ left: -15, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: number) => [`${v}°C`, 'Temperature']}
                    />
                    {/* Red reference line at the threshold */}
                    {tempMax && (
                      <ReferenceLine
                        y={tempMax}
                        stroke="#ef4444"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: `Max ${tempMax}°C`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={(props) =>
                        tempMax ? (
                          <BreachDot
                            key={`temp-dot-${props.index}`}
                            cx={props.cx}
                            cy={props.cy}
                            value={props.value as number}
                            threshold={tempMax}
                            color="#f59e0b"
                          />
                        ) : <></>
                      }
                      activeDot={{ r: 4, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Readings table ───────────────────────────────────────────────── */}
          <Card padding={false}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Raw Readings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {data?.page.totalElements ?? 0} readings in selected range
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-6"><Skeleton className="h-40 w-full" /></div>
            ) : readings.length === 0 ? (
              <EmptyState title="No readings" description="No data in this date range — adjust the filters above" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['#', 'Timestamp', 'RMS (mm/s)', 'Temperature', 'Breach', 'Processed'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {readings.map(r => {
                        const rmsBreach  = rmsMax  != null && r.rms         > rmsMax;
                        const tempBreach = tempMax != null && r.temperature > tempMax;
                        const isBreach   = rmsBreach || tempBreach;
                        return (
                          <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${isBreach ? 'bg-red-50/40' : ''}`}>
                            <td className="px-6 py-3.5 text-slate-400 text-xs font-mono">#{r.id}</td>
                            <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">{formatDate(r.timestamp)}</td>
                            <td className={`px-5 py-3.5 font-semibold ${rmsBreach ? 'text-red-600' : 'text-slate-900'}`}>
                              {formatRms(r.rms)}
                              {rmsBreach && <span className="ml-1 text-xs text-red-400">↑</span>}
                            </td>
                            <td className={`px-5 py-3.5 ${tempBreach ? 'font-semibold text-red-600' : 'text-slate-700'}`}>
                              {formatTemp(r.temperature)}
                              {tempBreach && <span className="ml-1 text-xs text-red-400">↑</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              {isBreach ? (
                                <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                  ⚠ Breach
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                  Normal
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {r.processed
                                ? <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Yes</span>
                                : <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Page {(data?.page.number ?? 0) + 1} of {totalPages} &middot; {data?.page.totalElements} total readings
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
