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
import { Activity, RotateCcw, ChevronLeft, ChevronRight, TrendingUp, Thermometer } from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { format, parseISO, subDays, endOfDay } from 'date-fns';

function BreachDot({ cx = 0, cy = 0, value = 0, threshold }) {
  if (value <= threshold) return null;
  return (
    <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
    >
      <p className="font-bold text-white mb-1">{label}</p>
      <p className="font-semibold" style={{ color: '#a5b4fc' }}>{payload[0].value} {unit}</p>
    </div>
  );
}

export function Readings() {
  const [assetId,  setAssetId]  = useState(null);
  const [sensorId, setSensorId] = useState(null);
  const [from,     setFrom]     = useState(() => format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"));
  const [to,       setTo]       = useState(() => format(endOfDay(new Date()),   "yyyy-MM-dd'T'HH:mm"));
  const [page,     setPage]     = useState(0);

  const { data: assets = [] }  = useQuery({ queryKey: ['assets'],  queryFn: assetsApi.getAll });
  const { data: sensors = [] } = useQuery({ queryKey: ['sensors'], queryFn: sensorsApi.getAll });

  const filteredSensors = assetId ? sensors.filter(s => s.assetId === assetId) : sensors;

  const { data: threshold } = useQuery({
    queryKey: ['threshold', 'by-asset', assetId],
    queryFn: () => thresholdsApi.getByAsset(assetId),
    enabled: !!assetId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['readings', sensorId, from, to, page],
    queryFn: () =>
      readingsApi.getPage({
        sensorId: sensorId,
        from: from ? `${from}:00` : undefined,
        to:   to   ? `${to}:00`   : undefined,
        page,
        size: 50,
      }),
    enabled: !!sensorId,
  });

  const readings   = data?.content ?? [];
  const totalPages = data?.page?.totalPages ?? 1;
  const rmsMax     = threshold?.rmsMax  ?? null;
  const tempMax    = threshold?.tempMax ?? null;

  const chartData = useMemo(() =>
    [...readings].reverse().map(r => ({
      time: format(parseISO(r.timestamp), 'dd/MM HH:mm'),
      rms:  r.rms        != null ? +r.rms.toFixed(2)         : null,
      temp: r.temperature != null ? +r.temperature.toFixed(1) : null,
    })),
    [readings]
  );

  const handleReset = () => {
    setAssetId(null);
    setSensorId(null);
    setFrom(format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"));
    setTo(format(endOfDay(new Date()),     "yyyy-MM-dd'T'HH:mm"));
    setPage(0);
  };

  return (
    <>
      <PageHeader
        title="Readings"
        subtitle="Sensor telemetry — vibration and temperature trends"
      />

      <div
        className="rounded-2xl border border-slate-100 p-5 mb-6"
        style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)' }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <Select
              label="Asset"
              options={assets.map(a => ({ value: String(a.id), label: a.name }))}
              placeholder="All assets"
              value={assetId ? String(assetId) : ''}
              onChange={e => {
                setAssetId(e.target.value ? Number(e.target.value) : null);
                setSensorId(null);
                setPage(0);
              }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Sensor"
              options={filteredSensors.map(s => ({
                value: String(s.id),
                label: assetId ? s.name : `${s.name} (${s.assetName})`,
              }))}
              placeholder="Select a sensor..."
              value={sensorId ? String(sensorId) : ''}
              onChange={e => { setSensorId(e.target.value ? Number(e.target.value) : null); setPage(0); }}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Input
              label="From"
              type="datetime-local"
              value={from}
              onChange={e => { setFrom(e.target.value); setPage(0); }}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Input
              label="To"
              type="datetime-local"
              value={to}
              onChange={e => { setTo(e.target.value); setPage(0); }}
            />
          </div>
          <Button variant="secondary" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleReset}>
            Reset
          </Button>
        </div>

        {threshold && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Thresholds for {threshold.assetName}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))' }}
              >
                <Activity className="w-3 h-3 text-violet-500" />
              </span>
              RMS max: <strong className="text-violet-700">{threshold.rmsMax} mm/s</strong>
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}
              >
                <Thermometer className="w-3 h-3 text-amber-500" />
              </span>
              Temp max: <strong className="text-amber-700">{threshold.tempMax}°C</strong>
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-red-500">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Red dots = breach
            </span>
          </div>
        )}
      </div>

      {!sensorId ? (
        <Card>
          <EmptyState
            icon={<Activity className="w-7 h-7" />}
            title="Select an asset and sensor"
            description="Use the filters above to choose a sensor and date range, then view its readings and trend charts"
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="RMS Vibration Trend"
                subtitle={rmsMax ? `Threshold: ${rmsMax} mm/s — red dots = breach` : 'Vibration (mm/s)'}
                action={
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))' }}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                }
              />
              {isLoading ? <Skeleton className="h-56 w-full" /> :
               chartData.length === 0 ? (
                <EmptyState title="No readings in this range" description="Adjust the date range or publish some readings" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ left: -15, right: 8, top: 4 }}>
                    <defs>
                      <linearGradient id="rmsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      content={(props) => <ChartTooltip {...props} unit="mm/s" />}
                    />
                    {rmsMax && (
                      <ReferenceLine
                        y={rmsMax}
                        stroke="#ef4444"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: `Max ${rmsMax}`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="rms"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#rmsGrad)"
                      dot={(props) =>
                        rmsMax ? (
                          <BreachDot
                            key={`rms-dot-${props.index}`}
                            cx={props.cx}
                            cy={props.cy}
                            value={props.value}
                            threshold={rmsMax}
                            color="#6366f1"
                          />
                        ) : <></>
                      }
                      activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Temperature Trend"
                subtitle={tempMax ? `Threshold: ${tempMax}°C — red dots = breach` : 'Temperature (°C)'}
                action={
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.1)' }}
                  >
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                }
              />
              {isLoading ? <Skeleton className="h-56 w-full" /> :
               chartData.length === 0 ? (
                <EmptyState title="No readings in this range" description="Adjust the date range or publish some readings" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ left: -15, right: 8, top: 4 }}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      content={(props) => <ChartTooltip {...props} unit="°C" />}
                    />
                    {tempMax && (
                      <ReferenceLine
                        y={tempMax}
                        stroke="#ef4444"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: `Max ${tempMax}°C`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#tempGrad)"
                      dot={(props) =>
                        tempMax ? (
                          <BreachDot
                            key={`temp-dot-${props.index}`}
                            cx={props.cx}
                            cy={props.cy}
                            value={props.value}
                            threshold={tempMax}
                            color="#f59e0b"
                          />
                        ) : <></>
                      }
                      activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card padding={false}>
            <div
              className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(241,245,249,0.6))' }}
            >
              <div>
                <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Raw Readings</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {data?.page?.totalElements ?? 0} readings in selected range
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
                      <tr
                        className="border-b border-slate-100"
                        style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                      >
                        {['#', 'Timestamp', 'RMS (mm/s)', 'Temperature', 'Breach', 'Processed'].map(h => (
                          <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3.5 first:pl-6">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((r, idx) => {
                        const rmsBreach  = rmsMax  != null && r.rms         > rmsMax;
                        const tempBreach = tempMax != null && r.temperature > tempMax;
                        const isBreach   = rmsBreach || tempBreach;
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                            style={{
                              background: isBreach
                                ? 'rgba(254,242,242,0.5)'
                                : idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.4)',
                            }}
                          >
                            <td className="px-6 py-3.5">
                              <code
                                className="text-[11px] font-bold px-1.5 py-0.5 rounded-lg"
                                style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)' }}
                              >
                                #{r.id}
                              </code>
                            </td>
                            <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap text-[12px] font-medium">{formatDate(r.timestamp)}</td>
                            <td className={`px-5 py-3.5 font-bold tabular-nums ${rmsBreach ? 'text-red-600' : 'text-slate-900'}`}>
                              {formatRms(r.rms)}
                              {rmsBreach && (
                                <span
                                  className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                                  style={{ color: '#dc2626', background: 'rgba(239,68,68,0.1)' }}
                                >
                                  ↑ OVER
                                </span>
                              )}
                            </td>
                            <td className={`px-5 py-3.5 font-bold tabular-nums ${tempBreach ? 'text-red-600' : 'text-slate-700'}`}>
                              {formatTemp(r.temperature)}
                              {tempBreach && (
                                <span
                                  className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                                  style={{ color: '#dc2626', background: 'rgba(239,68,68,0.1)' }}
                                >
                                  ↑ OVER
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {isBreach ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                                  style={{ color: '#dc2626', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                >
                                  Breach
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                                  style={{ color: '#047857', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                                >
                                  Normal
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {r.processed
                                ? <span
                                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                    style={{ color: '#047857', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                                  >
                                    Done
                                  </span>
                                : <span
                                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                    style={{ color: '#92400e', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
                                  >
                                    Pending
                                  </span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  className="px-6 py-4 border-t border-slate-100 flex items-center justify-between"
                  style={{ background: 'rgba(248,250,252,0.6)' }}
                >
                  <p className="text-xs text-slate-500 font-medium">
                    Page <span className="font-bold text-slate-700">{(data?.page?.number ?? 0) + 1}</span> of {totalPages}
                    &ensp;·&ensp;
                    <span className="font-bold text-slate-700">{data?.page?.totalElements}</span> total readings
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary" size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      icon={<ChevronLeft className="w-3.5 h-3.5" />}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="secondary" size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
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
