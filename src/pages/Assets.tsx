import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin, Tag, CheckCircle2, XCircle } from 'lucide-react';
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
        subtitle={`${assets?.length ?? 0} assets registered`}
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            New Asset
          </Button>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (assets?.length ?? 0) === 0 ? (
          <EmptyState
            title="No assets yet"
            description="Add your first piece of equipment to start monitoring"
            action={<Button onClick={() => setCreateOpen(true)}>Add Asset</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Name', 'Type', 'Location', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assets!.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{asset.name}</p>
                      {asset.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{asset.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {asset.assetType ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Tag className="w-3 h-3" />{asset.assetType}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {asset.location ? (
                        <span className="flex items-center gap-1 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" />{asset.location}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {asset.active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3 h-3" />Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditAsset(asset)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(asset.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
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
