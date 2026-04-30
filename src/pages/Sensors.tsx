import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Radio } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { sensorsApi } from '../api/sensors';
import { assetsApi } from '../api/assets';
import type { Sensor, SensorRequest, SensorType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { sensorTypeColors, sensorTypeLabel, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  assetId:      z.coerce.number().min(1, 'Asset is required'),
  name:         z.string().min(1, 'Name is required').max(100),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  sensorType:   z.enum(['VIBRATION', 'TEMPERATURE', 'COMBINED'] as const),
});
type FormData = z.infer<typeof schema>;

function SensorForm({ onSubmit, defaultValues, loading, assets }: {
  onSubmit: (d: FormData) => void;
  defaultValues?: Partial<FormData>;
  loading?: boolean;
  assets: { id: number; name: string }[];
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Asset" required
        error={errors.assetId?.message}
        placeholder="Select an asset..."
        options={assets.map(a => ({ value: String(a.id), label: a.name }))}
        {...register('assetId')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Sensor Name" required error={errors.name?.message} {...register('name')} placeholder="e.g. Vibration Sensor" />
        <Input label="Serial Number" error={errors.serialNumber?.message} {...register('serialNumber')} placeholder="SN-PUMP01-VIB" />
      </div>
      <Select
        label="Sensor Type" required
        error={errors.sensorType?.message}
        placeholder="Select type..."
        options={[
          { value: 'VIBRATION',   label: 'Vibration' },
          { value: 'TEMPERATURE', label: 'Temperature' },
          { value: 'COMBINED',    label: 'Combined (RMS + Temp)' },
        ]}
        {...register('sensorType')}
      />
      <div className="pt-1">
        <Button type="submit" loading={loading} className="w-full">Save Sensor</Button>
      </div>
    </form>
  );
}

// Sensor type badge style map for dot colors
const sensorTypeDotColor: Record<string, string> = {
  VIBRATION:   '#6366f1',
  TEMPERATURE: '#f59e0b',
  COMBINED:    '#10b981',
};

export function Sensors() {
  const qc = useQueryClient();
  const { canWrite, canDelete } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSensor, setEditSensor] = useState<Sensor | null>(null);
  const [deleteId, setDeleteId]     = useState<number | null>(null);

  const { data: sensors, isLoading } = useQuery({ queryKey: ['sensors'], queryFn: sensorsApi.getAll });
  const { data: assets = [] }        = useQuery({ queryKey: ['assets'],  queryFn: assetsApi.getAll });

  const createMutation = useMutation({
    mutationFn: (d: SensorRequest) => sensorsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); setCreateOpen(false); toast.success('Sensor created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SensorRequest }) => sensorsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); setEditSensor(null); toast.success('Sensor updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sensorsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); setDeleteId(null); toast.success('Sensor deleted'); },
  });

  const assetOptions = assets.map(a => ({ id: a.id, name: a.name }));

  return (
    <>
      <PageHeader
        title="Sensors"
        subtitle={`${sensors?.length ?? 0} sensors registered`}
        action={
          canWrite ? (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
              New Sensor
            </Button>
          ) : undefined
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (sensors?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Radio className="w-7 h-7" />}
            title="No sensors yet"
            description="Add sensors to your assets to start collecting data"
            action={canWrite ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Sensor</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                >
                  {['Sensor', 'Asset', 'Serial Number', 'Type', 'Status', 'Installed', ...(canWrite || canDelete ? ['Actions'] : [])].map(h => (
                    <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensors!.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/30 transition-colors group"
                    style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))',
                            border: '1px solid rgba(16,185,129,0.15)',
                          }}
                        >
                          <Radio className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{s.name}</span>
                          {/* Active indicator dot next to name */}
                          {s.active && (
                            <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{s.assetName}</td>
                    <td className="px-5 py-4">
                      {s.serialNumber
                        ? <code className="font-mono text-[12px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{s.serialNumber}</code>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: sensorTypeDotColor[s.sensorType] ?? '#94a3b8' }}
                        />
                        <Badge dot={false} label={sensorTypeLabel[s.sensorType]} className={sensorTypeColors[s.sensorType]} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {s.active
                        ? <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                          >
                            <CheckCircle2 className="w-3 h-3" />Active
                          </span>
                        : <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}
                          >
                            <XCircle className="w-3 h-3" />Inactive
                          </span>
                      }
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-[12px] font-medium">{formatDate(s.installedAt)}</td>
                    {(canWrite || canDelete) && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {canWrite && (
                            <button onClick={() => setEditSensor(s)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Sensor" subtitle="Register a sensor on an asset">
        <SensorForm onSubmit={d => createMutation.mutate(d as SensorRequest)} loading={createMutation.isPending} assets={assetOptions} />
      </Modal>

      <Modal open={!!editSensor} onClose={() => setEditSensor(null)} title="Edit Sensor" subtitle={editSensor?.name}>
        {editSensor && (
          <SensorForm
            defaultValues={{ ...editSensor, sensorType: editSensor.sensorType as SensorType }}
            onSubmit={d => updateMutation.mutate({ id: editSensor.id, data: d as SensorRequest })}
            loading={updateMutation.isPending}
            assets={assetOptions}
          />
        )}
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Sensor"
        message="This will permanently delete the sensor and all its readings. This action cannot be undone."
      />
    </>
  );
}
