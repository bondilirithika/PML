import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Radio, Power, PowerOff, X } from 'lucide-react';
import { sensorsApi } from '../api/sensors';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { sensorTypeColors, sensorTypeLabel, sensorTypeStyle, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function Sensors() {
  const qc = useQueryClient();
  const { canWrite } = useAuth();
  const { state: locationState } = useLocation();
  const [activeOnly, setActiveOnly] = useState(locationState?.activeOnly ?? false);

  const { data: sensors, isLoading } = useQuery({ queryKey: ['sensors'], queryFn: sensorsApi.getAll });

  const displayed = activeOnly ? (sensors ?? []).filter(s => s.active) : (sensors ?? []);

  const statusMutation = useMutation({
    mutationFn: ({ id, active }) => sensorsApi.setStatus(id, active),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      toast.success(active ? 'Sensor activated' : 'Sensor deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to update sensor status'),
  });

  return (
    <>
      <PageHeader
        title="Sensors"
        subtitle={`${displayed.length} ${activeOnly ? 'active' : 'total'} sensors across all assets`}
        action={
          activeOnly ? (
            <button
              onClick={() => setActiveOnly(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#047857', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <X className="w-3 h-3" /> Active only
            </button>
          ) : undefined
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<Radio className="w-7 h-7" />}
            title={activeOnly ? 'No active sensors' : 'No sensors registered'}
            description={activeOnly ? 'All sensors are currently inactive' : 'Go to the Assets page and click on an asset\'s sensor count to add sensors'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100"
                  style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}>
                  {['Sensor', 'Asset', 'Serial Number', 'Type', 'Status', 'Installed'].map(h => (
                    <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((s, idx) => (
                  <tr key={s.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/30 transition-colors"
                    style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <Radio className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-slate-600 font-medium text-[13px]">{s.assetName}</span>
                    </td>

                    <td className="px-5 py-4">
                      {s.serialNumber
                        ? <code className="font-mono text-[12px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{s.serialNumber}</code>
                        : <span className="text-slate-300">—</span>}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: sensorTypeStyle[s.sensorType]?.dot ?? '#94a3b8' }} />
                        <Badge dot={false} label={sensorTypeLabel[s.sensorType]} className={sensorTypeColors[s.sensorType]} />
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {canWrite ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: s.id, active: !s.active })}
                          disabled={statusMutation.isPending}
                          title={s.active ? 'Click to deactivate' : 'Click to activate'}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
                          style={s.active
                            ? { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                            : { color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }
                          }
                        >
                          {s.active ? <><Power className="w-3 h-3" />Active</> : <><PowerOff className="w-3 h-3" />Inactive</>}
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={s.active
                            ? { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
                            : { color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }
                          }
                        >
                          {s.active ? <><CheckCircle2 className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-[12px] font-medium">
                      {formatDate(s.installedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
