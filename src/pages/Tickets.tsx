import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

export function Tickets() {
  const qc = useQueryClient();
  const [page, setPage]               = useState(0);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [updatingId, setUpdatingId]   = useState<number | null>(null);

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

  const tickets = data?.content ?? [];
  const filtered = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets;
  const totalPages = data?.page.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle={`${data?.page.totalElements ?? 0} total maintenance tickets`}
        action={
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
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
              className="w-40"
            />
          </div>
        }
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><SkeletonTable rows={8} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No tickets found" description="Ticket will be auto-created when a reading breaches a threshold" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['#', 'Asset', 'Sensor', 'Status', 'Description', 'Created', 'Action'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((ticket: Ticket) => {
                    const next = allowedTransitions[ticket.status];
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">#{ticket.id}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{ticket.assetName}</td>
                        <td className="px-5 py-4 text-slate-600">{ticket.sensorName}</td>
                        <td className="px-5 py-4">
                          <Badge label={ticketStatusLabel[ticket.status]} className={ticketStatusColors[ticket.status]} />
                        </td>
                        <td className="px-5 py-4 text-slate-600 max-w-xs">
                          <span className="truncate block" title={ticket.description}>{ticket.description}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">
                          <span title={formatDate(ticket.createdAt)}>{formatRelative(ticket.createdAt)}</span>
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
                                'text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700',
                                'focus:outline-none focus:ring-1 focus:ring-primary-500',
                                'disabled:opacity-50'
                              )}
                              defaultValue=""
                            >
                              <option value="" disabled>Move to…</option>
                              {next.map(s => (
                                <option key={s} value={s}>{ticketStatusLabel[s]}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Terminal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {(data?.page.number ?? 0) + 1} of {totalPages} &middot; {data?.page.totalElements} tickets
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
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
