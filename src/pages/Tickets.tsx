import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Filter, Ticket as TicketIcon } from 'lucide-react';
import { ticketsApi } from '../api/tickets';
import type { Ticket, TicketStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ticketStatusColors, ticketStatusLabel, formatDate, formatRelative, allowedTransitions } from '../utils/formatters';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const PAGE_SIZE = 15;

// Priority indicator based on status
function PriorityDot({ status }: { status: TicketStatus }) {
  const colors: Record<string, string> = {
    OPEN:        '#ef4444',
    IN_PROGRESS: '#f59e0b',
    RESOLVED:    '#10b981',
    CLOSED:      '#94a3b8',
  };
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: colors[status] ?? '#94a3b8' }}
    />
  );
}

export function Tickets() {
  const qc = useQueryClient();
  const [page, setPage]                 = useState(0);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [updatingId, setUpdatingId]     = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'page', page],
    queryFn: () => ticketsApi.getPage({ page, size: PAGE_SIZE, sort: 'createdAt,desc' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) =>
      ticketsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setUpdatingId(null);
      toast.success('Ticket status updated');
    },
  });

  const tickets    = data?.content ?? [];
  const filtered   = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets;
  const totalPages = data?.page.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle={`${data?.page.totalElements ?? 0} total maintenance tickets`}
        action={
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'white', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <Select
                options={[
                  { value: 'OPEN',        label: 'Open' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'RESOLVED',    label: 'Resolved' },
                  { value: 'CLOSED',      label: 'Closed' },
                ]}
                placeholder="All statuses"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(0); }}
                className="w-36 border-0 shadow-none p-0 bg-transparent focus:ring-0 rounded-none text-slate-700 font-semibold"
              />
            </div>
          </div>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable rows={8} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TicketIcon className="w-7 h-7" />}
            title="No tickets found"
            description="Tickets are auto-created when a reading breaches a configured threshold"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-slate-100"
                    style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.8))' }}
                  >
                    {['#', 'Asset', 'Sensor', 'Status', 'Description', 'Created', 'Action'].map(h => (
                      <th key={h} className="sticky top-0 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest px-5 py-4 first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket: Ticket, idx: number) => {
                    const next = allowedTransitions[ticket.status];
                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors"
                        style={{ background: idx % 2 === 0 ? 'white' : 'rgba(248,250,252,0.5)' }}
                      >
                        <td className="px-6 py-4">
                          <code
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                          >
                            #{ticket.id}
                          </code>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <PriorityDot status={ticket.status} />
                            <span className="font-bold text-slate-900">{ticket.assetName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-medium">{ticket.sensorName}</td>
                        <td className="px-5 py-4">
                          <Badge dot label={ticketStatusLabel[ticket.status]} className={ticketStatusColors[ticket.status]} />
                        </td>
                        <td className="px-5 py-4 text-slate-600 max-w-xs">
                          <span className="truncate block text-[13px]" title={ticket.description}>{ticket.description}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-[12px] font-semibold text-slate-700">{formatRelative(ticket.createdAt)}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(ticket.createdAt)}</div>
                        </td>
                        <td className="px-5 py-4">
                          {next.length > 0 ? (
                            <select
                              disabled={updatingId === ticket.id || updateMutation.isPending}
                              onChange={e => {
                                if (!e.target.value) return;
                                setUpdatingId(ticket.id);
                                updateMutation.mutate({ id: ticket.id, status: e.target.value as TicketStatus });
                                e.target.value = '';
                              }}
                              className={clsx(
                                'text-[12px] font-semibold rounded-xl px-3 py-1.5 bg-white text-slate-700',
                                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'transition-all duration-150 cursor-pointer',
                              )}
                              style={{ border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                              defaultValue=""
                            >
                              <option value="" disabled>Move to…</option>
                              {next.map(s => (
                                <option key={s} value={s}>{ticketStatusLabel[s]}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}
                            >
                              Terminal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="px-6 py-4 border-t border-slate-100 flex items-center justify-between"
              style={{ background: 'rgba(248,250,252,0.6)' }}
            >
              <p className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold text-slate-700">{(data?.page.number ?? 0) + 1}</span> of {totalPages}
                &ensp;·&ensp;
                <span className="font-bold text-slate-700">{data?.page.totalElements}</span> tickets total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary" size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary" size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
