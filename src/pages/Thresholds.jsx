import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, SlidersHorizontal, Thermometer, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { thresholdsApi } from '../api/thresholds';
import { assetsApi } from '../api/assets';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  assetId: z.coerce.number().min(1, 'Asset is required'),
  rmsMax:  z.coerce.number().positive('RMS max must be positive'),
  tempMax: z.coerce.number().positive('Temp max must be positive'),
});

function ThresholdForm({ onSubmit, defaultValues, loading, assets, isEdit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
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
  const { canCreate, canWrite, canDelete } = useAuth();
  const [createOpen, setCreateOpen]       = useState(false);
  const [editThreshold, setEditThreshold] = useState(null);
  const [deleteId, setDeleteId]           = useState(null);

  const { data: thresholds, isLoading } = useQuery({ queryKey: ['thresholds'], queryFn: thresholdsApi.getAll });
  const { data: assets = [] }           = useQuery({ queryKey: ['assets'],     queryFn: assetsApi.getAll });

  const createMutation = useMutation({
    mutationFn: (d) => thresholdsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      qc.invalidateQueries({ queryKey: ['threshold'] });
      setCreateOpen(false);
      toast.success('Threshold created');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to create threshold'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => thresholdsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      qc.invalidateQueries({ queryKey: ['threshold'] });
      setEditThreshold(null);
      toast.success('Threshold updated');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to update threshold'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => thresholdsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      qc.invalidateQueries({ queryKey: ['threshold'] });
      setDeleteId(null);
      toast.success('Threshold deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to delete threshold'),
  });

  return (
    <>
      <PageHeader
        title="Thresholds"
        subtitle="Configure RMS and temperature alert limits per asset"
        action={
          canCreate ? (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
              New Threshold
            </Button>
          ) : undefined
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (thresholds?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal className="w-7 h-7" />}
            title="No thresholds configured"
            description="Set RMS and temperature limits to auto-generate tickets on breaches"
            action={canCreate ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Threshold</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                >
                  {['Asset', 'Max RMS (mm/s)', 'Max Temperature (°C)', 'Last Updated', ...(canWrite || canDelete ? ['Actions'] : [])].map(h => (
                    <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t, idx) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors group"
                    style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))',
                            border: '1px solid rgba(99,102,241,0.12)',
                          }}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <span className="font-bold text-slate-900">{t.assetName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.06), rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                        >
                          <Activity className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-black text-violet-700 text-base tabular-nums">{t.rmsMax}</span>
                        <span className="text-xs font-bold text-violet-400">mm/s</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        >
                          <Thermometer className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-black text-amber-700 text-base tabular-nums">{t.tempMax}</span>
                        <span className="text-xs font-bold text-amber-400">°C</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-[12px] font-medium">{formatDate(t.updatedAt)}</td>
                    {(canWrite || canDelete) && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {canWrite && (
                            <button
                              onClick={() => setEditThreshold(t)}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteId(t.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                              title="Delete"
                            >
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Threshold" subtitle="Set RMS and temperature limits">
        <ThresholdForm onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} assets={assets.map(a => ({ id: a.id, name: a.name }))} />
      </Modal>

      <Modal open={!!editThreshold} onClose={() => setEditThreshold(null)} title="Edit Threshold" subtitle={editThreshold?.assetName}>
        {editThreshold && (
          <ThresholdForm
            isEdit
            defaultValues={{ assetId: editThreshold.assetId, rmsMax: editThreshold.rmsMax, tempMax: editThreshold.tempMax }}
            onSubmit={d => updateMutation.mutate({ id: editThreshold.id, data: d })}
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
