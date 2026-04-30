import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { simulatorApi } from '../api/simulator';
import { sensorsApi } from '../api/sensors';
import type { IoTPayloadRequest, Reading } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageHeader } from '../components/ui/PageHeader';
import { Radio, CheckCircle2, AlertTriangle, Zap, Cpu, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatRms, formatTemp } from '../utils/formatters';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const schema = z.object({
  deviceId: z.string().min(1, 'Device ID (serial number) is required'),
  rms:      z.coerce.number().min(0, 'RMS cannot be negative').max(100),
  temp:     z.coerce.number().min(-50, 'Temperature too low').max(300, 'Temperature too high'),
  ts:       z.string().min(1, 'Timestamp is required'),
});
type FormData = z.infer<typeof schema>;

interface ResultCardProps {
  reading: Reading;
}

function ResultCard({ reading }: ResultCardProps) {
  return (
    <div
      className="rounded-2xl border p-5 animate-slide-up"
      style={{
        background: 'linear-gradient(135deg, rgba(209,250,229,0.7), rgba(167,243,208,0.4))',
        borderColor: 'rgba(16,185,129,0.28)',
        boxShadow: '0 4px 20px rgba(16,185,129,0.12)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 3px 10px rgba(16,185,129,0.35)' }}
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-emerald-800">Payload processed successfully</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Reading stored & threshold evaluated</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Reading ID', value: `#${reading.id}` },
          { label: 'Asset',      value: reading.assetName },
          { label: 'RMS',        value: `${formatRms(reading.rms)} mm/s` },
          { label: 'Temperature',value: formatTemp(reading.temperature) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-bold text-slate-900 text-sm">{value}</p>
          </div>
        ))}
        <div
          className="col-span-2 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Timestamp</p>
          <p className="font-bold text-slate-900 text-sm">{formatDate(reading.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}

export function Simulator() {
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [lastReading, setLastReading] = useState<Reading | null>(null);
  const { data: sensors = [] } = useQuery({ queryKey: ['sensors'], queryFn: sensorsApi.getAll });

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ts: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") },
  });

  const mutation = useMutation({
    mutationFn: (d: IoTPayloadRequest) => simulatorApi.publish(d),
    onSuccess: (reading) => {
      setLastReading(reading);
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['assets', 'violations'] });
      toast.success('IoT payload published and evaluated');
    },
  });

  const handleSensorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sensor = sensors.find(s => s.id === Number(e.target.value));
    if (sensor?.serialNumber) setValue('deviceId', sensor.serialNumber);
  };

  const currentRms  = Number(watch('rms'))  || 0;
  const currentTemp = Number(watch('temp')) || 0;
  const willBreach  = currentRms > 5 || currentTemp > 95;
  const hasValues   = currentRms > 0 || currentTemp > 0;

  if (!canWrite) {
    return (
      <div>
        <PageHeader
          title="IoT Simulator"
          subtitle="Simulate Azure IoT Hub / AWS IoT Core device payloads"
        />
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.15))', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Access Restricted</h3>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            The IoT Simulator requires Manager or Admin privileges. Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="IoT Simulator"
        subtitle="Simulate Azure IoT Hub / AWS IoT Core device payloads"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Publish Device Payload"
            subtitle="Simulates a reading arriving from a real IoT device"
            action={
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 3px 10px rgba(99,102,241,0.35)',
                }}
              >
                <Radio className="w-4 h-4 text-white" />
              </div>
            }
          />

          <div
            className="mb-5 p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(241,245,249,0.7))',
              border: '1px solid rgba(226,232,240,0.8)',
            }}
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400" />
              Quick Fill from Sensor
            </p>
            <Select
              options={sensors.map(s => ({ value: String(s.id), label: `${s.name} — ${s.serialNumber ?? 'no serial'} (${s.assetName})` }))}
              placeholder="Select a sensor to auto-fill deviceId..."
              onChange={handleSensorSelect}
            />
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d as IoTPayloadRequest))} className="space-y-4">
            <Input
              label="Device ID (Serial Number)"
              required
              error={errors.deviceId?.message}
              hint="Maps to sensor.serialNumber — e.g. SN-PUMP01-VIB"
              {...register('deviceId')}
              placeholder="SN-PUMP01-VIB"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="RMS (mm/s)" required type="number" step="0.01"
                error={errors.rms?.message}
                hint="Normal: 1–4.5 | Breach: >5.0"
                {...register('rms')}
                placeholder="7.5"
              />
              <Input
                label="Temperature (°C)" required type="number" step="0.1"
                error={errors.temp?.message}
                hint="Normal: 40–80°C | Breach: >95°C"
                {...register('temp')}
                placeholder="98.0"
              />
            </div>
            <Input
              label="Timestamp" required type="datetime-local" step="1"
              error={errors.ts?.message}
              {...register('ts')}
            />

            {hasValues && (
              <div
                className={clsx(
                  'flex items-center gap-3 text-sm rounded-xl p-4 transition-all duration-300',
                  willBreach ? 'border border-red-200' : 'border border-emerald-200'
                )}
                style={{
                  background: willBreach
                    ? 'linear-gradient(135deg, rgba(254,226,226,0.7), rgba(252,165,165,0.25))'
                    : 'linear-gradient(135deg, rgba(209,250,229,0.7), rgba(167,243,208,0.25))',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: willBreach
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: willBreach
                      ? '0 3px 8px rgba(239,68,68,0.30)'
                      : '0 3px 8px rgba(16,185,129,0.30)',
                  }}
                >
                  {willBreach
                    ? <AlertTriangle className="w-4 h-4 text-white" />
                    : <CheckCircle2 className="w-4 h-4 text-white" />
                  }
                </div>
                <div>
                  {willBreach ? (
                    <>
                      <p className="font-extrabold text-red-700 text-sm">Threshold breach expected</p>
                      <p className="text-xs text-red-500 font-medium mt-0.5">A maintenance ticket will be auto-created</p>
                    </>
                  ) : (
                    <>
                      <p className="font-extrabold text-emerald-700 text-sm">Reading looks normal</p>
                      <p className="text-xs text-emerald-500 font-medium mt-0.5">Unlikely to trigger a ticket</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={mutation.isPending}
              icon={<Zap className="w-4 h-4" />}
              className="w-full"
              size="lg"
            >
              Publish Payload
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          {lastReading && <ResultCard reading={lastReading} />}

          <Card>
            <CardHeader title="How it works" subtitle="Azure IoT Hub / AWS IoT Core simulation" />
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  text: <>Your IoT device sends a payload with <code className="bg-slate-100 px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-600">deviceId</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-600">rms</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-600">temp</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-600">ts</code></>,
                },
                {
                  step: '2',
                  text: <><code className="bg-slate-100 px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-600">deviceId</code> maps to <code className="bg-slate-100 px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-600">sensor.serialNumber</code> in the database</>,
                },
                {
                  step: '3',
                  text: "The reading is saved and immediately evaluated against the asset's threshold",
                },
                {
                  step: '4',
                  text: 'If RMS > rmsMax or Temp > tempMax → a maintenance ticket is auto-created',
                },
              ].map(({ step, text }) => (
                <div key={step} className="flex gap-3 items-start">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}
                  >
                    {step}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Active Sensors"
              subtitle="Registered serial numbers — click to use"
              action={
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              }
            />
            <div className="space-y-1.5">
              {sensors.filter(s => s.active && s.serialNumber).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer group"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(248,250,252,0.8)';
                    (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(226,232,240,0.8)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent';
                  }}
                  onClick={() => setValue('deviceId', s.serialNumber!)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{s.assetName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <code
                      className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl"
                      style={{
                        color: '#6366f1',
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.15)',
                      }}
                    >
                      {s.serialNumber}
                    </code>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
              {sensors.filter(s => s.active && s.serialNumber).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4 font-medium">No sensors with serial numbers</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
