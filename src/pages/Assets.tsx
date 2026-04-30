import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, MapPin, Tag, CheckCircle2, XCircle,
  Server, SlidersHorizontal, AlertTriangle, Activity, Thermometer,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetsApi } from '../api/assets';
import { thresholdsApi } from '../api/thresholds';
import type { Asset, AssetRequest, Threshold } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Shared threshold section ─────────────────────────────────────────────────

function ThresholdSection({ errors, register }: {
  errors: { rmsMax?: { message?: string }; tempMax?: { message?: string } };
  register: ReturnType<typeof useForm>['register'];
}) {
  return (
    <div className="pt-1">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
        </div>
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Safety Thresholds</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.12)' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Max RMS (mm/s)" type="number" step="0.1" required
            error={errors.rmsMax?.message} {...register('rmsMax')} placeholder="5.0" />
          <p className="text-[11px] text-slate-400 mt-1">Vibration · typical 5.0 for pumps</p>
        </div>
        <div>
          <Input label="Max Temperature (°C)" type="number" step="0.5" required
            error={errors.tempMax?.message} {...register('tempMax')} placeholder="95" />
          <p className="text-[11px] text-slate-400 mt-1">Temperature · typical 95 °C</p>
        </div>
      </div>
    </div>
  );
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const assetThresholdSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  location:    z.string().max(200).optional().or(z.literal('')),
  assetType:   z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  rmsMax:      z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be > 0'),
  tempMax:     z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be > 0'),
});
type AssetThresholdForm = z.infer<typeof assetThresholdSchema>;

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateAssetForm({ onSubmit, loading }: { onSubmit: (d: AssetThresholdForm) => void; loading?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AssetThresholdForm>({
    resolver: zodResolver(assetThresholdSchema),
    defaultValues: { rmsMax: 5.0, tempMax: 95 },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Asset Name" required error={errors.name?.message} {...register('name')} placeholder="e.g. Pump-01" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Location" error={errors.location?.message} {...register('location')} placeholder="Plant A – Floor 1" />
        <Input label="Asset Type" error={errors.assetType?.message} {...register('assetType')} placeholder="PUMP, MOTOR…" />
      </div>
      <Input label="Description" error={errors.description?.message} {...register('description')} placeholder="Brief description…" />
      <ThresholdSection errors={errors} register={register} />
      <div className="pt-1">
        <Button type="submit" loading={loading} className="w-full">Create Asset</Button>
      </div>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditAssetForm({ onSubmit, defaultValues, loading }: {
  onSubmit: (d: AssetThresholdForm) => void;
  defaultValues: Partial<AssetThresholdForm>;
  loading?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<AssetThresholdForm>({
    resolver: zodResolver(assetThresholdSchema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Asset Name" required error={errors.name?.message} {...register('name')} placeholder="e.g. Pump-01" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Location" error={errors.location?.message} {...register('location')} placeholder="Plant A – Floor 1" />
        <Input label="Asset Type" error={errors.assetType?.message} {...register('assetType')} placeholder="PUMP, MOTOR…" />
      </div>
      <Input label="Description" error={errors.description?.message} {...register('description')} placeholder="Brief description…" />
      <ThresholdSection errors={errors} register={register} />
      <div className="pt-1">
        <Button type="submit" loading={loading} className="w-full">Save Changes</Button>
      </div>
    </form>
  );
}

// ─── Assets page ──────────────────────────────────────────────────────────────

export function Assets() {
  const qc = useQueryClient();
  const { canWrite, canDelete } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset, setEditAsset]   = useState<Asset | null>(null);
  const [deleteId, setDeleteId]     = useState<number | null>(null);

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.getAll,
  });

  const { data: thresholds } = useQuery({
    queryKey: ['thresholds'],
    queryFn: thresholdsApi.getAll,
  });

  const thresholdMap = useMemo(() => {
    const map = new Map<number, Threshold>();
    thresholds?.forEach(t => map.set(t.assetId, t));
    return map;
  }, [thresholds]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (d: AssetThresholdForm) => {
      const asset = await assetsApi.create({
        name: d.name, location: d.location, assetType: d.assetType, description: d.description,
      } as AssetRequest);
      await thresholdsApi.create({ assetId: asset.id, rmsMax: d.rmsMax, tempMax: d.tempMax });
      return asset;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      setCreateOpen(false);
      toast.success('Asset created with thresholds');
    },
    onError: () => toast.error('Failed to create asset'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AssetThresholdForm }) => {
      await assetsApi.update(id, {
        name: data.name, location: data.location, assetType: data.assetType, description: data.description,
      } as AssetRequest);
      const existing = thresholdMap.get(id);
      if (existing) {
        await thresholdsApi.update(existing.id, { assetId: id, rmsMax: data.rmsMax, tempMax: data.tempMax });
      } else {
        await thresholdsApi.create({ assetId: id, rmsMax: data.rmsMax, tempMax: data.tempMax });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      setEditAsset(null);
      toast.success('Asset updated');
    },
    onError: () => toast.error('Failed to update asset'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      setDeleteId(null);
      toast.success('Asset deleted');
    },
  });

  // ── Edit defaults (pre-populate threshold values) ─────────────────────────────

  const editDefaults = useMemo((): Partial<AssetThresholdForm> => {
    if (!editAsset) return {};
    const t = thresholdMap.get(editAsset.id);
    return {
      name:        editAsset.name,
      location:    editAsset.location ?? '',
      assetType:   editAsset.assetType ?? '',
      description: editAsset.description ?? '',
      rmsMax:      t?.rmsMax  ?? 5.0,
      tempMax:     t?.tempMax ?? 95,
    };
  }, [editAsset, thresholdMap]);

  // ── Table headers ─────────────────────────────────────────────────────────────

  const headers = ['Name', 'Type', 'Location', 'Thresholds', 'Status', ...(canWrite || canDelete ? ['Actions'] : [])];

  return (
    <>
      <PageHeader
        title="Assets"
        subtitle={`${assets?.length ?? 0} industrial assets registered`}
        action={
          canWrite ? (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
              New Asset
            </Button>
          ) : undefined
        }
      />

      <Card padding={false}>
        {assetsLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (assets?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Server className="w-7 h-7" />}
            title="No assets yet"
            description="Add your first piece of equipment to start monitoring"
            action={canWrite ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Asset</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                >
                  {headers.map(h => (
                    <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets!.map((asset, idx) => {
                  const threshold = thresholdMap.get(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors group"
                      style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.12)' }}
                          >
                            <Server className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{asset.name}</p>
                            {asset.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{asset.description}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        {asset.assetType ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#6d28d9', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}
                          >
                            <Tag className="w-3 h-3" />{asset.assetType}
                          </span>
                        ) : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        {asset.location ? (
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[13px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{asset.location}
                          </span>
                        ) : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      {/* Thresholds */}
                      <td className="px-5 py-4">
                        {threshold ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold"
                              style={{ color: '#4f46e5' }}>
                              <Activity className="w-3 h-3" />{threshold.rmsMax} mm/s
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold"
                              style={{ color: '#0891b2' }}>
                              <Thermometer className="w-3 h-3" />{threshold.tempMax} °C
                            </span>
                          </div>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full"
                            style={{ color: '#92400e', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                          >
                            <AlertTriangle className="w-3 h-3" />Not set
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {asset.active ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                          >
                            <CheckCircle2 className="w-3 h-3" />Active
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}
                          >
                            <XCircle className="w-3 h-3" />Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {(canWrite || canDelete) && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {canWrite && (
                              <button
                                onClick={() => setEditAsset(asset)}
                                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
                                title="Edit asset & thresholds"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteId(asset.id)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Asset" subtitle="Register equipment and configure safety thresholds">
        <CreateAssetForm onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Asset" subtitle={editAsset?.name ?? ''}>
        {editAsset && (
          <EditAssetForm
            key={editAsset.id}
            defaultValues={editDefaults}
            onSubmit={d => updateMutation.mutate({ id: editAsset.id, data: d })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Asset"
        message="This will permanently delete the asset and all its sensors, readings, tickets and thresholds. This action cannot be undone."
      />
    </>
  );
}
