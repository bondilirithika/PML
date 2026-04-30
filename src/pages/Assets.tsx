import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin, Tag, CheckCircle2, XCircle, Server } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetsApi } from '../api/assets';
import type { Asset, AssetRequest } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  location:    z.string().max(200).optional().or(z.literal('')),
  assetType:   z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

// ─── Asset Form ───────────────────────────────────────────────────────────────

function AssetForm({
  onSubmit, defaultValues, loading,
}: {
  onSubmit: (d: FormData) => void;
  defaultValues?: Partial<FormData>;
  loading?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Asset Name" required error={errors.name?.message} {...register('name')} placeholder="e.g. Pump-01" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Location" error={errors.location?.message} {...register('location')} placeholder="Plant A - Floor 1" />
        <Input label="Asset Type" error={errors.assetType?.message} {...register('assetType')} placeholder="PUMP, MOTOR..." />
      </div>
      <Input label="Description" error={errors.description?.message} {...register('description')} placeholder="Brief description..." />
      <div className="pt-1">
        <Button type="submit" loading={loading} className="w-full">Save Asset</Button>
      </div>
    </form>
  );
}

// ─── Assets page ─────────────────────────────────────────────────────────────

export function Assets() {
  const qc = useQueryClient();
  const { canWrite, canDelete } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset, setEditAsset]   = useState<Asset | null>(null);
  const [deleteId, setDeleteId]     = useState<number | null>(null);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (d: AssetRequest) => assetsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setCreateOpen(false); toast.success('Asset created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetRequest }) => assetsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setEditAsset(null); toast.success('Asset updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setDeleteId(null); toast.success('Asset deleted'); },
  });

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
                <tr
                  className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                >
                  {['Name', 'Type', 'Location', 'Status', ...(canWrite || canDelete ? ['Actions'] : [])].map(h => (
                    <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets!.map((asset, idx) => (
                  <tr
                    key={asset.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors group"
                    style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}
                  >
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
                          {asset.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{asset.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {asset.assetType ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{
                            color: '#6d28d9',
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.08))',
                            border: '1px solid rgba(139,92,246,0.2)',
                          }}
                        >
                          <Tag className="w-3 h-3" />{asset.assetType}
                        </span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {asset.location ? (
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[13px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{asset.location}
                        </span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
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
                    {(canWrite || canDelete) && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {canWrite && (
                            <button
                              onClick={() => setEditAsset(asset)}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
                              title="Edit"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Asset" subtitle="Register a new piece of equipment">
        <AssetForm onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Asset" subtitle={editAsset?.name}>
        {editAsset && (
          <AssetForm
            defaultValues={editAsset}
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
        message="This will permanently delete the asset and all its sensors, readings and tickets. This action cannot be undone."
      />
    </>
  );
}
