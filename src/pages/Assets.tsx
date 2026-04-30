import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, MapPin, Tag, CheckCircle2, XCircle,
  Server, SlidersHorizontal, AlertTriangle, Activity, Thermometer,
  Cpu, Radio, X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetsApi } from '../api/assets';
import { thresholdsApi } from '../api/thresholds';
import { sensorsApi } from '../api/sensors';
import type { Asset, AssetRequest, Threshold, Sensor, SensorType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Sensor type helpers ──────────────────────────────────────────────────────

const sensorTypeLabel: Record<string, string> = {
  VIBRATION:   'Vibration',
  TEMPERATURE: 'Temperature',
  COMBINED:    'Combined',
};

const sensorTypeStyle: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  VIBRATION:   { bg: 'rgba(99,102,241,0.08)',  color: '#6366f1', border: 'rgba(99,102,241,0.2)',  dot: '#6366f1' },
  TEMPERATURE: { bg: 'rgba(245,158,11,0.08)',  color: '#d97706', border: 'rgba(245,158,11,0.2)',  dot: '#f59e0b' },
  COMBINED:    { bg: 'rgba(16,185,129,0.08)',  color: '#059669', border: 'rgba(16,185,129,0.2)',  dot: '#10b981' },
};

// ─── Sensor form (no asset dropdown — asset is fixed from context) ────────────

const sensorSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(100),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  sensorType:   z.enum(['VIBRATION', 'TEMPERATURE', 'COMBINED'] as const),
});
type SensorFormData = z.infer<typeof sensorSchema>;

function SensorForm({ onSubmit, defaultValues, loading, onCancel, isEdit }: {
  onSubmit: (d: SensorFormData) => void;
  defaultValues?: Partial<SensorFormData>;
  loading?: boolean;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<SensorFormData>({
    resolver: zodResolver(sensorSchema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Sensor Name" required error={errors.name?.message}
          {...register('name')} placeholder="e.g. Vibration Sensor A" />
        <Input label="Serial Number" error={errors.serialNumber?.message}
          {...register('serialNumber')} placeholder="SN-PUMP01-VIB" />
      </div>
      <Select
        label="Sensor Type" required
        error={errors.sensorType?.message}
        placeholder="Select type…"
        options={[
          { value: 'VIBRATION',   label: 'Vibration' },
          { value: 'TEMPERATURE', label: 'Temperature' },
          { value: 'COMBINED',    label: 'Combined (RMS + Temp)' },
        ]}
        {...register('sensorType')}
      />
      <div className="flex gap-2 pt-1">
        <button
          type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
        >
          Cancel
        </button>
        <Button type="submit" loading={loading} className="flex-1">
          {isEdit ? 'Save Changes' : 'Add Sensor'}
        </Button>
      </div>
    </form>
  );
}

// ─── Threshold section (shared by create + edit forms) ───────────────────────

const assetThresholdSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  location:    z.string().max(200).optional().or(z.literal('')),
  assetType:   z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  rmsMax:      z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be > 0'),
  tempMax:     z.coerce.number({ invalid_type_error: 'Required' }).positive('Must be > 0'),
});
type AssetThresholdForm = z.infer<typeof assetThresholdSchema>;

function ThresholdSection({ errors, register }: {
  errors: Partial<Record<keyof AssetThresholdForm, { message?: string }>>;
  register: ReturnType<typeof useForm>['register'];
}) {
  return (
    <div className="pt-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
        </div>
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Safety Thresholds</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.12)' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Max RMS (mm/s)" type="number" step="0.1" required
            error={errors.rmsMax?.message} {...register('rmsMax')} placeholder="5.0" />
          <p className="text-[11px] text-slate-400 mt-1">Vibration · typical 5.0</p>
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

  // ── Asset / threshold modal state ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset,  setEditAsset]  = useState<Asset | null>(null);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  // ── Sensor management modal state ─────────────────────────────────────────
  const [managingAsset,   setManagingAsset]   = useState<Asset | null>(null);
  const [showSensorForm,  setShowSensorForm]  = useState(false);
  const [editingSensor,   setEditingSensor]   = useState<Sensor | null>(null);
  const [deleteSensorId,  setDeleteSensorId]  = useState<number | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: assets,     isLoading } = useQuery({ queryKey: ['assets'],     queryFn: assetsApi.getAll });
  const { data: thresholds }            = useQuery({ queryKey: ['thresholds'], queryFn: thresholdsApi.getAll });
  const { data: sensors }               = useQuery({ queryKey: ['sensors'],    queryFn: sensorsApi.getAll });

  const thresholdMap = useMemo(() => {
    const map = new Map<number, Threshold>();
    thresholds?.forEach(t => map.set(t.assetId, t));
    return map;
  }, [thresholds]);

  const sensorMap = useMemo(() => {
    const map = new Map<number, Sensor[]>();
    sensors?.forEach(s => {
      const list = map.get(s.assetId) ?? [];
      list.push(s);
      map.set(s.assetId, list);
    });
    return map;
  }, [sensors]);

  // ── Derived: sensors for the currently managed asset ─────────────────────
  const managingSensors = managingAsset ? (sensorMap.get(managingAsset.id) ?? []) : [];

  // ── Asset mutations ───────────────────────────────────────────────────────
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
      toast.success('Asset created');
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
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setDeleteId(null);
      toast.success('Asset deleted');
    },
  });

  // ── Sensor mutations ──────────────────────────────────────────────────────
  const sensorCreateMutation = useMutation({
    mutationFn: (d: SensorFormData & { assetId: number }) =>
      sensorsApi.create({ assetId: d.assetId, name: d.name, serialNumber: d.serialNumber, sensorType: d.sensorType as SensorType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setShowSensorForm(false);
      toast.success('Sensor added');
    },
    onError: () => toast.error('Failed to add sensor'),
  });

  const sensorUpdateMutation = useMutation({
    mutationFn: ({ id, assetId, data }: { id: number; assetId: number; data: SensorFormData }) =>
      sensorsApi.update(id, { assetId, name: data.name, serialNumber: data.serialNumber, sensorType: data.sensorType as SensorType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setEditingSensor(null);
      setShowSensorForm(false);
      toast.success('Sensor updated');
    },
    onError: () => toast.error('Failed to update sensor'),
  });

  const sensorDeleteMutation = useMutation({
    mutationFn: (id: number) => sensorsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setDeleteSensorId(null);
      toast.success('Sensor deleted');
    },
  });

  // ── Edit defaults (asset + threshold) ─────────────────────────────────────
  const editDefaults = useMemo((): Partial<AssetThresholdForm> => {
    if (!editAsset) return {};
    const t = thresholdMap.get(editAsset.id);
    return {
      name: editAsset.name, location: editAsset.location ?? '', assetType: editAsset.assetType ?? '',
      description: editAsset.description ?? '', rmsMax: t?.rmsMax ?? 5.0, tempMax: t?.tempMax ?? 95,
    };
  }, [editAsset, thresholdMap]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openManage(asset: Asset) {
    setManagingAsset(asset);
    setShowSensorForm(false);
    setEditingSensor(null);
  }

  function closeManage() {
    setManagingAsset(null);
    setShowSensorForm(false);
    setEditingSensor(null);
  }

  const headers = ['Name', 'Type', 'Location', 'Sensors', 'Thresholds', 'Status', ...(canWrite || canDelete ? ['Actions'] : [])];

  return (
    <>
      <PageHeader
        title="Assets"
        subtitle={`${assets?.length ?? 0} industrial assets registered`}
        action={canWrite ? (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>New Asset</Button>
        ) : undefined}
      />

      <Card padding={false}>
        {isLoading ? (
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
                <tr className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}>
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
                  const assetSensors = sensorMap.get(asset.id) ?? [];
                  return (
                    <tr key={asset.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                      style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.12)' }}>
                            <Server className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{asset.name}</p>
                            {asset.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{asset.description}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        {asset.assetType ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#6d28d9', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Tag className="w-3 h-3" />{asset.assetType}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        {asset.location ? (
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[13px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{asset.location}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Sensors — clickable badge */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openManage(asset)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all duration-150 hover:scale-105"
                          style={assetSensors.length > 0
                            ? { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                            : { color: '#64748b', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }
                          }
                          title="Manage sensors"
                        >
                          <Cpu className="w-3 h-3" />
                          {assetSensors.length} sensor{assetSensors.length !== 1 ? 's' : ''}
                        </button>
                      </td>

                      {/* Thresholds */}
                      <td className="px-5 py-4">
                        {threshold ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#4f46e5' }}>
                              <Activity className="w-3 h-3" />{threshold.rmsMax} mm/s
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#0891b2' }}>
                              <Thermometer className="w-3 h-3" />{threshold.tempMax} °C
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full"
                            style={{ color: '#92400e', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            <AlertTriangle className="w-3 h-3" />Not set
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {asset.active ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                            <CheckCircle2 className="w-3 h-3" />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
                            <XCircle className="w-3 h-3" />Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {(canWrite || canDelete) && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {canWrite && (
                              <button onClick={() => setEditAsset(asset)}
                                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeleteId(asset.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150" title="Delete">
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

      {/* ── Create Asset Modal ──────────────────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Asset" subtitle="Register equipment and configure safety thresholds">
        <CreateAssetForm onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      {/* ── Edit Asset Modal ────────────────────────────────────────────────── */}
      <Modal open={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Asset" subtitle={editAsset?.name ?? ''}>
        {editAsset && (
          <EditAssetForm key={editAsset.id} defaultValues={editDefaults}
            onSubmit={d => updateMutation.mutate({ id: editAsset.id, data: d })}
            loading={updateMutation.isPending} />
        )}
      </Modal>

      {/* ── Delete Asset Confirm ────────────────────────────────────────────── */}
      <ConfirmModal
        open={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Asset"
        message="This will permanently delete the asset and all its sensors, readings, tickets and thresholds. This action cannot be undone."
      />

      {/* ── Manage Sensors Modal ────────────────────────────────────────────── */}
      <Modal
        open={!!managingAsset}
        onClose={closeManage}
        title={`${managingAsset?.name ?? ''} · Sensors`}
        subtitle="View and manage sensors attached to this asset"
      >
        <div className="space-y-3">
          {/* Sensor list */}
          {managingSensors.length === 0 && !showSensorForm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No sensors yet</p>
              <p className="text-xs text-slate-400 mt-1">
                {canWrite ? 'Add the first sensor for this asset below.' : 'No sensors have been registered for this asset.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {managingSensors.map(sensor => {
                const st = sensorTypeStyle[sensor.sensorType] ?? sensorTypeStyle.COMBINED;
                return (
                  <div key={sensor.id}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                    style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)' }}>
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                      <Radio style={{ width: 13, height: 13, color: st.color }} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{sensor.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: st.bg, color: st.color }}>
                          {sensorTypeLabel[sensor.sensorType]}
                        </span>
                        {sensor.serialNumber && (
                          <code className="text-[11px] font-mono text-indigo-500">{sensor.serialNumber}</code>
                        )}
                      </div>
                    </div>
                    {/* Status */}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sensor.active ? '' : ''}`}
                      style={sensor.active
                        ? { color: '#047857', background: 'rgba(16,185,129,0.1)' }
                        : { color: '#64748b', background: 'rgba(100,116,139,0.1)' }
                      }>
                      {sensor.active ? 'Active' : 'Inactive'}
                    </span>
                    {/* Actions */}
                    {(canWrite || canDelete) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {canWrite && (
                          <button
                            onClick={() => { setEditingSensor(sensor); setShowSensorForm(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Edit sensor"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteSensorId(sensor.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete sensor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline sensor form */}
          {showSensorForm && managingAsset && (
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                  {editingSensor ? 'Edit Sensor' : 'New Sensor'}
                </p>
                <button
                  onClick={() => { setShowSensorForm(false); setEditingSensor(null); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <SensorForm
                key={editingSensor?.id ?? 'new'}
                isEdit={!!editingSensor}
                defaultValues={editingSensor ? {
                  name: editingSensor.name,
                  serialNumber: editingSensor.serialNumber ?? '',
                  sensorType: editingSensor.sensorType,
                } : undefined}
                loading={editingSensor ? sensorUpdateMutation.isPending : sensorCreateMutation.isPending}
                onCancel={() => { setShowSensorForm(false); setEditingSensor(null); }}
                onSubmit={d => {
                  if (editingSensor) {
                    sensorUpdateMutation.mutate({ id: editingSensor.id, assetId: managingAsset.id, data: d });
                  } else {
                    sensorCreateMutation.mutate({ ...d, assetId: managingAsset.id });
                  }
                }}
              />
            </div>
          )}

          {/* Add sensor button */}
          {canWrite && !showSensorForm && (
            <button
              onClick={() => { setEditingSensor(null); setShowSensorForm(true); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-all duration-150"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.35)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.06)'; }}
            >
              <Plus className="w-3.5 h-3.5" />Add Sensor
            </button>
          )}
        </div>
      </Modal>

      {/* ── Delete Sensor Confirm ───────────────────────────────────────────── */}
      <ConfirmModal
        open={deleteSensorId !== null}
        onClose={() => setDeleteSensorId(null)}
        onConfirm={() => deleteSensorId !== null && sensorDeleteMutation.mutate(deleteSensorId)}
        loading={sensorDeleteMutation.isPending}
        title="Delete Sensor"
        message="This will permanently delete the sensor and all its readings. This action cannot be undone."
      />
    </>
  );
}
