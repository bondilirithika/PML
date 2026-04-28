import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Radio, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
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
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 animate-slide-in">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-800">Payload processed successfully</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Reading ID</p>
          <p className="font-semibold text-slate-900">#{reading.id}</p>
        </div>
        <div>
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Asset</p>
          <p className="font-semibold text-slate-900">{reading.assetName}</p>
        </div>
        <div>
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-0.5">RMS</p>
          <p className="font-semibold text-slate-900">{formatRms(reading.rms)} mm/s</p>
        </div>
        <div>
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Temperature</p>
          <p className="font-semibold text-slate-900">{formatTemp(reading.temperature)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Timestamp</p>
          <p className="font-semibold text-slate-900">{formatDate(reading.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}

export function Simulator() {
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
      toast.success('IoT payload published and evaluated');
    },
  });

  const handleSensorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sensor = sensors.find(s => s.id === Number(e.target.value));
    if (sensor?.serialNumber) setValue('deviceId', sensor.serialNumber);
  };

  const currentRms  = Number(watch('rms'))  || 0;
  const currentTemp = Number(watch('temp')) || 0;

  return (
    <>
      <PageHeader
        title="IoT Simulator"
        subtitle="Simulate Azure IoT Hub / AWS IoT Core device payloads"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Publish Form */}
        <Card>
          <CardHeader
            title="Publish Device Payload"
            subtitle="Simulates a reading arriving from a real IoT device"
            action={<Radio className="w-4 h-4 text-slate-400" />}
          />

          {/* Quick fill from sensor */}
          <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Fill</p>
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
              label="Timestamp" required type="datetime-local"
              error={errors.ts?.message}
              {...register('ts')}
            />

            {/* Live breach indicator */}
            {(currentRms > 0 || currentTemp > 0) && (
              <div className={clsx(
                'flex items-center gap-2 text-sm rounded-lg p-3',
                currentRms > 5 || currentTemp > 95
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              )}>
                {currentRms > 5 || currentTemp > 95
                  ? <><AlertTriangle className="w-4 h-4 flex-shrink-0" /> This reading will breach typical thresholds and trigger a ticket</>
                  : <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> This reading looks normal — unlikely to trigger a ticket</>
                }
              </div>
            )}

            <Button type="submit" loading={mutation.isPending} icon={<Zap className="w-4 h-4" />} className="w-full">
              Publish Payload
            </Button>
          </form>
        </Card>

        {/* Result / Reference panel */}
        <div className="space-y-5">
          {lastReading && <ResultCard reading={lastReading} />}

          <Card>
            <CardHeader title="How it works" subtitle="Azure IoT Hub / AWS IoT Core simulation" />
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <p>Your IoT device sends a payload with <code className="bg-slate-100 px-1 rounded text-xs">deviceId</code>, <code className="bg-slate-100 px-1 rounded text-xs">rms</code>, <code className="bg-slate-100 px-1 rounded text-xs">temp</code>, <code className="bg-slate-100 px-1 rounded text-xs">ts</code></p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <p><code className="bg-slate-100 px-1 rounded text-xs">deviceId</code> maps to <code className="bg-slate-100 px-1 rounded text-xs">sensor.serialNumber</code> in the database</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <p>The reading is saved and immediately evaluated against the asset's threshold</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                <p>If RMS {'>'} rmsMax <strong>or</strong> Temp {'>'} tempMax → a maintenance ticket is auto-created</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Active Sensors" subtitle="Registered serial numbers" />
            <div className="space-y-2">
              {sensors.filter(s => s.active && s.serialNumber).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.assetName}</p>
                  </div>
                  <code
                    className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded cursor-pointer hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    onClick={() => setValue('deviceId', s.serialNumber!)}
                    title="Click to use this serial number"
                  >
                    {s.serialNumber}
                  </code>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
