import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, SlidersHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { thresholdsApi } from '../api/thresholds';
import { assetsApi } from '../api/assets';
import type { Threshold, ThresholdRequest } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const schema = z.object({
  assetId: z.coerce.number().min(1, 'Asset is required'),
  rmsMax:  z.coerce.number().positive('RMS max must be positive'),
  tempMax: z.coerce.number().positive('Temp max must be positive'),
});
type FormData = z.infer<typeof schema>;

function ThresholdForm({ onSubmit, defaultValues, loading, assets, isEdit }: {
  onSubmit: (d: FormData) => void;
  defaultValues?: Partial<FormData>;
  loading?: boolean;
  assets: { id: number; name: string }[];
  isEdit?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEdit && (
        <Select
          label="Asset" required
          error={errors.assetId?.message}
          placeholder="Select an asset..."
          options={assets.map(a => ({ value: String(a.id), label: a.name }))}
          {...register('assetId')}
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Max RMS (mm/s)" required type="number" step="0.1"
          error={errors.rmsMax?.message}
          hint="Vibration limit. Typical: 5.0 for pumps"
          {...register('rmsMax')}
        />
        <Input
          label="Max Temperature (°C)" required type="number" step="0.5"
          error={errors.tempMax?.message}
          hint="Temperature limit. Typical: 95°C"
          {...register('tempMax')}
        />
      </div>
      <Button type="submit" loading={loading} className="w-full">Save Threshold</Button>
    </form>
  );
}

export function Thresholds() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen]       = useState(false);
  const [editThreshold, setEditThreshold] = useState<Threshold | null>(null);
  const [deleteId, setDeleteId]           = useState<number | null>(null);

  const { data: thresholds, isLoading } = useQuery({ queryKey: ['thresholds'], queryFn: thresholdsApi.getAll });
  const { data: assets = [] }           = useQuery({ queryKey: ['assets'],     queryFn: assetsApi.getAll });

  const createMutation = useMutation({
    mutationFn: (d: ThresholdRequest) => thresholdsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['thresholds'] }); setCreateOpen(false); toast.success('Threshold created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ThresholdRequest }) => thresholdsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['thresholds'] }); setEditThreshold(null); toast.success('Threshold updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => thresholdsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['thresholds'] }); setDeleteId(null); toast.success('Threshold deleted'); },
  });

  return (
    <>
      <PageHeader
        title="Thresholds"
        subtitle="Configure alert limits per asset"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            New Threshold
          </Button>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (thresholds?.length ?? 0) === 0 ? (
          <EmptyState icon={<SlidersHorizontal className="w-6 h-6" />} title="No thresholds configured" description="Set RMS and temperature limits for your assets" action={<Button onClick={() => setCreateOpen(true)}>Add Threshold</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Asset', 'Max RMS (mm/s)', 'Max Temperature (°C)', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {thresholds!.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.assetName}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full text-sm">
                        {t.rmsMax} mm/s
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full text-sm">
                        {t.tempMax}°C
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(t.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditThreshold(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Threshold" subtitle="Set RMS and temperature limits">
        <ThresholdForm onSubmit={d => createMutation.mutate(d as ThresholdRequest)} loading={createMutation.isPending} assets={assets.map(a => ({ id: a.id, name: a.name }))} />
      </Modal>

      <Modal open={!!editThreshold} onClose={() => setEditThreshold(null)} title="Edit Threshold" subtitle={editThreshold?.assetName}>
        {editThreshold && (
          <ThresholdForm
            isEdit
            defaultValues={{ assetId: editThreshold.assetId, rmsMax: editThreshold.rmsMax, tempMax: editThreshold.tempMax }}
            onSubmit={d => updateMutation.mutate({ id: editThreshold.id, data: d as ThresholdRequest })}
            loading={updateMutation.isPending}
            assets={assets.map(a => ({ id: a.id, name: a.name }))}
          />
        )}
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Threshold"
        message="This will remove the threshold configuration. No new tickets will be generated for this asset until a new threshold is set."
      />
    </>
  );
}
