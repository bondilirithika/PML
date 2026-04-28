import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
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

export function Sensors() {
  const qc = useQueryClient();
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
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            New Sensor
          </Button>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (sensors?.length ?? 0) === 0 ? (
          <EmptyState title="No sensors yet" description="Add sensors to your assets to start collecting data" action={<Button onClick={() => setCreateOpen(true)}>Add Sensor</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Sensor', 'Asset', 'Serial Number', 'Type', 'Status', 'Installed', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sensors!.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-5 py-4 text-slate-600">{s.assetName}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{s.serialNumber ?? '—'}</td>
                    <td className="px-5 py-4">
                      <Badge label={sensorTypeLabel[s.sensorType]} className={sensorTypeColors[s.sensorType]} />
                    </td>
                    <td className="px-5 py-4">
                      {s.active
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" />Active</span>
                        : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3" />Inactive</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDate(s.installedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditSensor(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
