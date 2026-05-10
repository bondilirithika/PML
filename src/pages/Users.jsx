import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ShieldCheck, Users as UsersIcon, Crown, Wrench, Power, PowerOff } from 'lucide-react';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
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
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password cannot exceed 64 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Must contain at least one special character (!@#$%^&*)'),
  role: z.enum(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_TECHNICIAN'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
});

const roleLabel = {
  ROLE_ADMIN:      'Admin',
  ROLE_MANAGER:    'Manager',
  ROLE_TECHNICIAN: 'Technician',
};

const roleStyle = {
  ROLE_ADMIN:      { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)',  icon: Crown },
  ROLE_MANAGER:    { color: '#059669', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  icon: ShieldCheck },
  ROLE_TECHNICIAN: { color: '#d97706', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: Wrench },
};

function AddUserForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Username" required
          error={errors.username?.message}
          {...register('username')}
          placeholder="e.g. jsmith"
        />
        <Input
          label="Email" required type="email"
          error={errors.email?.message}
          {...register('email')}
          placeholder="jsmith@company.com"
        />
      </div>
      <Input
        label="Password" required type="password"
        error={errors.password?.message}
        hint="Min 8 chars, uppercase, lowercase, number, special character"
        {...register('password')}
        placeholder="••••••••"
      />
      <Select
        label="Role" required
        error={errors.role?.message}
        placeholder="Select a role…"
        options={[
          { value: 'ROLE_ADMIN',      label: 'Admin' },
          { value: 'ROLE_MANAGER',    label: 'Manager' },
          { value: 'ROLE_TECHNICIAN', label: 'Technician' },
        ]}
        {...register('role')}
      />
      <div className="pt-1">
        <Button type="submit" loading={loading} className="w-full">Create User</Button>
      </div>
    </form>
  );
}

export function Users() {
  const qc = useQueryClient();
  const { user: currentUser, isAdmin } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      toast.success('User created');
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? 'Failed to create user';
      toast.error(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }) => usersApi.setStatus(id, active),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setTogglingId(null);
      toast.success(active ? 'User activated' : 'User deactivated');
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err.response?.data?.message ?? 'Failed to update user status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      toast.success('User deleted');
    },
    onError: (err) => {
      const msg = err.response?.data?.message ?? 'Failed to delete user';
      toast.error(msg);
    },
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  const deleteTarget = users.find(u => u.id === deleteId);

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.length} registered user${users.length !== 1 ? 's' : ''}`}
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Add User
          </Button>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable rows={4} /></div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-7 h-7" />}
            title="No users yet"
            description="Add the first user to get started"
            action={
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
                Add User
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                >
                  {['#', 'Username', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const rs = roleStyle[u.role] ?? roleStyle.ROLE_TECHNICIAN;
                  const RoleIcon = rs.icon;
                  const isSelf = u.username === currentUser?.username;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                      style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}
                    >
                      <td className="px-6 py-4">
                        <code
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                        >
                          #{u.id}
                        </code>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-black flex-shrink-0"
                            style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}
                          >
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[13px]">{u.username}</p>
                            {isSelf && (
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">You</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-500 font-medium text-[13px]">{u.email}</td>

                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ color: rs.color, background: rs.bg, border: `1px solid ${rs.border}` }}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleLabel[u.role]}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                            <Power className="w-3 h-3" />Active
                          </span>
                        ) : (
                          <button
                            onClick={() => { setTogglingId(u.id); statusMutation.mutate({ id: u.id, active: !u.active }); }}
                            disabled={togglingId === u.id || statusMutation.isPending}
                            title={u.active ? 'Click to deactivate' : 'Click to activate'}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
                            style={u.active
                              ? { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                              : { color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }
                            }
                          >
                            {u.active ? <><Power className="w-3 h-3" />Active</> : <><PowerOff className="w-3 h-3" />Inactive</>}
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500 text-[12px] font-medium whitespace-nowrap">
                        {u.createdAt ? formatDate(u.createdAt) : '—'}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          disabled={isSelf}
                          onClick={() => setDeleteId(u.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add User" subtitle="Create a new account and assign a role">
        <AddUserForm onSubmit={data => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={`Remove "${deleteTarget?.username ?? ''}" permanently? This cannot be undone.`}
      />
    </>
  );
}
