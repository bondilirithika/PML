import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, MapPin, Tag, CheckCircle2, XCircle,
  Server, SlidersHorizontal, AlertTriangle, Activity, Thermometer,
  Cpu, Radio, X, Power, PowerOff,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetsApi } from '../api/assets';
import { thresholdsApi } from '../api/thresholds';
import { sensorsApi } from '../api/sensors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { sensorTypeLabel, sensorTypeStyle } from '../utils/formatters';
import toast from 'react-hot-toast';

const sensorSchema = z.object({
  name:         z.string()
                  .min(1, 'Sensor name is required')
                  .min(2, 'Sensor name must be at least 2 characters')
                  .max(100, 'Sensor name cannot exceed 100 characters'),
  serialNumber: z.string()
                  .min(1, 'Serial number is required')
                  .max(100, 'Serial number cannot exceed 100 characters')
                  .regex(/^[A-Za-z0-9][A-Za-z0-9\-]+$/, 'Use letters, numbers and hyphens only, no spaces (e.g. SN-PUMP01-VIB)'),
  sensorType:   z.enum(['VIBRATION', 'TEMPERATURE', 'COMBINED'], {
                  errorMap: () => ({ message: 'Please select a sensor type' }),
                }),
});

function SensorForm({ onSubmit, defaultValues, loading, onCancel, isEdit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(sensorSchema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Sensor Name" required error={errors.name?.message}
          {...register('name')} placeholder="e.g. Vibration Sensor A" />
        <Input label="Serial Number" required error={errors.serialNumber?.message}
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

const assetThresholdSchema = z.object({
  name:        z.string()
                 .min(1, 'Asset name is required')
                 .min(2, 'Asset name must be at least 2 characters')
                 .max(100, 'Asset name cannot exceed 100 characters'),
  location:    z.string().max(200, 'Location cannot exceed 200 characters').optional().or(z.literal('')),
  assetType:   z.string().max(50, 'Asset type cannot exceed 50 characters').optional().or(z.literal('')),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal('')),
  rmsMax:      z.coerce.number({ invalid_type_error: 'RMS threshold is required' })
                 .positive('Must be greater than 0')
                 .max(50, 'RMS threshold cannot exceed 50 mm/s'),
  tempMax:     z.coerce.number({ invalid_type_error: 'Temperature threshold is required' })
                 .positive('Must be greater than 0')
                 .max(250, 'Temperature threshold cannot exceed 250 °C'),
});

function ThresholdSection({ errors, register }) {
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

function CreateAssetForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(assetThresholdSchema),
    defaultValues: { rmsMax: 5.0, tempMax: 95 },
  });

  const [pendingSensors,  setPendingSensors]  = useState([]);
  const [showSensorAdd,   setShowSensorAdd]   = useState(false);
  const [draft,           setDraft]           = useState({ name: '', serialNumber: '', sensorType: '' });
  const [draftError,      setDraftError]      = useState('');
  const [sensorListError, setSensorListError] = useState('');

  function addSensor() {
    const result = sensorSchema.safeParse({
      name:         draft.name.trim(),
      serialNumber: draft.serialNumber.trim(),
      sensorType:   draft.sensorType,
    });
    if (!result.success) {
      setDraftError(result.error.errors[0].message);
      return;
    }
    setPendingSensors(prev => [...prev, result.data]);
    setDraft({ name: '', serialNumber: '', sensorType: '' });
    setDraftError('');
    setSensorListError('');
    setShowSensorAdd(false);
  }

  return (
    <form onSubmit={handleSubmit(d => {
      if (pendingSensors.length === 0) { setSensorListError('Add at least one sensor before creating the asset.'); return; }
      setSensorListError('');
      onSubmit(d, pendingSensors);
    })} className="space-y-4">
      <Input label="Asset Name" required error={errors.name?.message} {...register('name')} placeholder="e.g. Pump-01" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Location" error={errors.location?.message} {...register('location')} placeholder="Plant A – Floor 1" />
        <Input label="Asset Type" error={errors.assetType?.message} {...register('assetType')} placeholder="PUMP, MOTOR…" />
      </div>
      <Input label="Description" error={errors.description?.message} {...register('description')} placeholder="Brief description…" />
      <ThresholdSection errors={errors} register={register} />

      {/* Sensors section */}
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Cpu className="w-3 h-3 text-emerald-500" />
          </div>
          <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Sensors</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(16,185,129,0.12)' }} />
          <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>Required</span>
        </div>

        {sensorListError && (
          <p className="text-xs text-red-600 font-medium -mt-1">{sensorListError}</p>
        )}

        {pendingSensors.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {pendingSensors.map((s, i) => {
              const st = sensorTypeStyle[s.sensorType] ?? sensorTypeStyle.COMBINED;
              return (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                  <span className="text-[13px] font-bold text-slate-800 flex-1">{s.name}</span>
                  {s.serialNumber && <code className="text-[11px] font-mono text-indigo-400">{s.serialNumber}</code>}
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>
                    {sensorTypeLabel[s.sensorType]}
                  </span>
                  <button type="button" onClick={() => setPendingSensors(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showSensorAdd ? (
          <div className="rounded-xl p-3 space-y-2.5"
            style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)' }}>
            <div className="grid grid-cols-2 gap-2.5">
              <Input label="Sensor Name" required value={draft.name}
                onChange={e => { setDraft(d => ({ ...d, name: e.target.value })); setDraftError(''); }}
                placeholder="e.g. Vibration A" />
              <Input label="Serial Number" required value={draft.serialNumber}
                onChange={e => { setDraft(d => ({ ...d, serialNumber: e.target.value })); setDraftError(''); }}
                placeholder="SN-PUMP01-VIB" />
            </div>
            <Select
              label="Sensor Type" required
              value={draft.sensorType}
              onChange={e => { setDraft(d => ({ ...d, sensorType: e.target.value })); setDraftError(''); }}
              placeholder="Select type…"
              options={[
                { value: 'VIBRATION',   label: 'Vibration' },
                { value: 'TEMPERATURE', label: 'Temperature' },
                { value: 'COMBINED',    label: 'Combined (RMS + Temp)' },
              ]}
            />
            {draftError && <p className="text-xs text-red-500 font-medium">{draftError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowSensorAdd(false); setDraftError(''); }}
                className="flex-1 py-1.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={addSensor}
                className="flex-1 py-1.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowSensorAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-all duration-150"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.06)'; }}>
            <Plus className="w-3.5 h-3.5" />Add Sensor
          </button>
        )}
      </div>

      <div className="pt-1">
        <Button type="submit" loading={loading} className="w-full">Create Asset</Button>
      </div>
    </form>
  );
}

function EditAssetForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
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

export function Assets() {
  const qc = useQueryClient();
  const { canCreate, canWrite, canDelete } = useAuth();
  const { state: locationState } = useLocation();
  const [violationsOnly, setViolationsOnly] = useState(locationState?.violationsOnly ?? false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset,  setEditAsset]  = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);

  const [managingAsset,   setManagingAsset]   = useState(null);
  const [showSensorForm,  setShowSensorForm]  = useState(false);
  const [editingSensor,   setEditingSensor]   = useState(null);
  const [deleteSensorId,  setDeleteSensorId]  = useState(null);

  const { data: assets,     isLoading } = useQuery({ queryKey: ['assets'],     queryFn: assetsApi.getAll });
  const { data: thresholds }            = useQuery({ queryKey: ['thresholds'], queryFn: thresholdsApi.getAll });
  const { data: sensors }               = useQuery({ queryKey: ['sensors'],    queryFn: sensorsApi.getAll });
  const { data: violations }            = useQuery({ queryKey: ['assets', 'violations'], queryFn: assetsApi.getViolations, enabled: violationsOnly });

  const thresholdMap = useMemo(() => {
    const map = new Map();
    thresholds?.forEach(t => map.set(t.assetId, t));
    return map;
  }, [thresholds]);

  const sensorMap = useMemo(() => {
    const map = new Map();
    sensors?.forEach(s => {
      const list = map.get(s.assetId) ?? [];
      list.push(s);
      map.set(s.assetId, list);
    });
    return map;
  }, [sensors]);

  const managingSensors = managingAsset ? (sensorMap.get(managingAsset.id) ?? []) : [];

  const createMutation = useMutation({
    mutationFn: async ({ form, sensors }) => {
      const asset = await assetsApi.create({
        name: form.name, location: form.location, assetType: form.assetType, description: form.description,
      });
      await thresholdsApi.create({ assetId: asset.id, rmsMax: form.rmsMax, tempMax: form.tempMax });
      for (const s of sensors) {
        await sensorsApi.create({ assetId: asset.id, name: s.name, serialNumber: s.serialNumber, sensorType: s.sensorType });
      }
      return asset;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setCreateOpen(false);
      toast.success('Asset created');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to create asset'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await assetsApi.update(id, {
        name: data.name, location: data.location, assetType: data.assetType, description: data.description,
      });
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
      qc.invalidateQueries({ queryKey: ['threshold'] });
      setEditAsset(null);
      toast.success('Asset updated');
    },
    onError: () => toast.error('Failed to update asset'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => assetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['thresholds'] });
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setDeleteId(null);
      toast.success('Asset deleted');
    },
    onError: (err) => {
      setDeleteId(null);
      toast.error(err.response?.data?.message ?? 'Failed to delete asset');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }) => assetsApi.setStatus(id, active),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success(active ? 'Asset activated' : 'Asset deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to update asset status'),
  });

  const sensorCreateMutation = useMutation({
    mutationFn: (d) =>
      sensorsApi.create({ assetId: d.assetId, name: d.name, serialNumber: d.serialNumber, sensorType: d.sensorType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setShowSensorForm(false);
      toast.success('Sensor added');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to add sensor'),
  });

  const sensorUpdateMutation = useMutation({
    mutationFn: ({ id, assetId, data }) =>
      sensorsApi.update(id, { assetId, name: data.name, serialNumber: data.serialNumber, sensorType: data.sensorType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setEditingSensor(null);
      setShowSensorForm(false);
      toast.success('Sensor updated');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to update sensor'),
  });

  const sensorStatusMutation = useMutation({
    mutationFn: ({ id, active }) => sensorsApi.setStatus(id, active),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      toast.success(active ? 'Sensor activated' : 'Sensor deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to update sensor status'),
  });

  const sensorDeleteMutation = useMutation({
    mutationFn: (id) => sensorsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      setDeleteSensorId(null);
      toast.success('Sensor deleted');
    },
    onError: (err) => {
      setDeleteSensorId(null);
      toast.error(err.response?.data?.message ?? 'Failed to delete sensor');
    },
  });

  const editDefaults = useMemo(() => {
    if (!editAsset) return {};
    const t = thresholdMap.get(editAsset.id);
    return {
      name: editAsset.name, location: editAsset.location ?? '', assetType: editAsset.assetType ?? '',
      description: editAsset.description ?? '', rmsMax: t?.rmsMax ?? 5.0, tempMax: t?.tempMax ?? 95,
    };
  }, [editAsset, thresholdMap]);

  function openManage(asset) {
    setManagingAsset(asset);
    setShowSensorForm(false);
    setEditingSensor(null);
  }

  function closeManage() {
    setManagingAsset(null);
    setShowSensorForm(false);
    setEditingSensor(null);
  }

  const violationIds = useMemo(() => new Set((violations ?? []).map(a => a.id)), [violations]);
  const displayedAssets = useMemo(() => {
    if (!violationsOnly || !assets) return assets ?? [];
    return assets.filter(a => violationIds.has(a.id));
  }, [assets, violationsOnly, violationIds]);

  const headers = ['Name', 'Type', 'Location', 'Sensors', 'Thresholds', 'Status', ...(canWrite || canDelete ? ['Actions'] : [])];

  return (
    <>
      <PageHeader
        title="Assets"
        subtitle={`${displayedAssets.length} ${violationsOnly ? 'assets with violations' : 'industrial assets registered'}`}
        action={
          <div className="flex items-center gap-2">
            {violationsOnly && (
              <button
                onClick={() => setViolationsOnly(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <X className="w-3 h-3" /> Violations only
              </button>
            )}
            {canCreate && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>New Asset</Button>}
          </div>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : displayedAssets.length === 0 ? (
          <EmptyState
            icon={<Server className="w-7 h-7" />}
            title={violationsOnly ? 'No violated assets' : 'No assets yet'}
            description={violationsOnly ? 'No threshold breaches in the last 24 hours' : 'Add your first piece of equipment to start monitoring'}
            action={canCreate && !violationsOnly ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Asset</Button> : undefined}
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
                {displayedAssets.map((asset, idx) => {
                  const threshold = thresholdMap.get(asset.id);
                  const assetSensors = sensorMap.get(asset.id) ?? [];
                  return (
                    <tr key={asset.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                      style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}>

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

                      <td className="px-5 py-4">
                        {asset.assetType ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#6d28d9', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Tag className="w-3 h-3" />{asset.assetType}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-5 py-4">
                        {asset.location ? (
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[13px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{asset.location}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>

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

                      <td className="px-5 py-4">
                        {canWrite ? (
                          <button
                            onClick={() => statusMutation.mutate({ id: asset.id, active: !asset.active })}
                            disabled={statusMutation.isPending}
                            title={asset.active ? 'Click to deactivate' : 'Click to activate'}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
                            style={asset.active
                              ? { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                              : { color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }
                            }
                          >
                            {asset.active
                              ? <><Power className="w-3 h-3" />Active</>
                              : <><PowerOff className="w-3 h-3" />Inactive</>
                            }
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={asset.active
                              ? { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                              : { color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }
                            }
                          >
                            {asset.active
                              ? <><CheckCircle2 className="w-3 h-3" />Active</>
                              : <><XCircle className="w-3 h-3" />Inactive</>
                            }
                          </span>
                        )}
                      </td>

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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Asset" subtitle="Register equipment and configure safety thresholds">
        <CreateAssetForm onSubmit={(form, sensors) => createMutation.mutate({ form, sensors })} loading={createMutation.isPending} />
      </Modal>

      <Modal open={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Asset" subtitle={editAsset?.name ?? ''}>
        {editAsset && (
          <EditAssetForm key={editAsset.id} defaultValues={editDefaults}
            onSubmit={d => updateMutation.mutate({ id: editAsset.id, data: d })}
            loading={updateMutation.isPending} />
        )}
      </Modal>

      <ConfirmModal
        open={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Asset"
        message="This will permanently delete the asset and all its sensors, readings, tickets and thresholds. This action cannot be undone."
      />

      <Modal
        open={!!managingAsset}
        onClose={closeManage}
        title={`${managingAsset?.name ?? ''} · Sensors`}
        subtitle="View and manage sensors attached to this asset"
      >
        <div className="space-y-3">
          {managingSensors.length === 0 && !showSensorForm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No sensors yet</p>
              <p className="text-xs text-slate-400 mt-1">
                {canCreate ? 'Add the first sensor for this asset below.' : 'No sensors have been registered for this asset.'}
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                      <Radio style={{ width: 13, height: 13, color: st.color }} />
                    </div>
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
                    {canWrite ? (
                      <button
                        onClick={() => sensorStatusMutation.mutate({ id: sensor.id, active: !sensor.active })}
                        disabled={sensorStatusMutation.isPending}
                        title={sensor.active ? 'Click to deactivate' : 'Click to activate'}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
                        style={sensor.active
                          ? { color: '#047857', background: 'rgba(16,185,129,0.1)' }
                          : { color: '#64748b', background: 'rgba(100,116,139,0.1)' }
                        }
                      >
                        {sensor.active ? 'Active' : 'Inactive'}
                      </button>
                    ) : (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={sensor.active
                          ? { color: '#047857', background: 'rgba(16,185,129,0.1)' }
                          : { color: '#64748b', background: 'rgba(100,116,139,0.1)' }
                        }
                      >
                        {sensor.active ? 'Active' : 'Inactive'}
                      </span>
                    )}
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

          {canCreate && !showSensorForm && (
            <button
              onClick={() => { setEditingSensor(null); setShowSensorForm(true); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-all duration-150"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.06)'; }}
            >
              <Plus className="w-3.5 h-3.5" />Add Sensor
            </button>
          )}
        </div>
      </Modal>

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
