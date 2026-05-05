import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (iso) =>
  iso ? format(parseISO(iso), 'dd MMM yyyy, HH:mm') : '—';

export const formatDateShort = (iso) =>
  iso ? format(parseISO(iso), 'dd MMM yyyy') : '—';

export const formatRelative = (iso) =>
  iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : '—';

export const formatRms = (v) => v.toFixed(2);
export const formatTemp = (v) => `${v.toFixed(1)}°C`;

export const ticketStatusLabel = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
};

export const ticketStatusColors = {
  OPEN:        'bg-red-100 text-red-700 border-red-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED:      'bg-slate-100 text-slate-600 border-slate-200',
};

export const sensorTypeLabel = {
  VIBRATION:   'Vibration',
  TEMPERATURE: 'Temperature',
  COMBINED:    'Combined',
};

export const sensorTypeColors = {
  VIBRATION:   'bg-violet-100 text-violet-700 border-violet-200',
  TEMPERATURE: 'bg-orange-100 text-orange-700 border-orange-200',
  COMBINED:    'bg-sky-100 text-sky-700 border-sky-200',
};

// Inline-style tokens for components that can't use Tailwind (e.g. dynamic borders/backgrounds)
export const sensorTypeStyle = {
  VIBRATION:   { bg: 'rgba(99,102,241,0.08)',  color: '#6366f1', border: 'rgba(99,102,241,0.2)',  dot: '#6366f1' },
  TEMPERATURE: { bg: 'rgba(245,158,11,0.08)',  color: '#d97706', border: 'rgba(245,158,11,0.2)',  dot: '#f59e0b' },
  COMBINED:    { bg: 'rgba(16,185,129,0.08)',  color: '#059669', border: 'rgba(16,185,129,0.2)',  dot: '#10b981' },
};

export const allowedTransitions = {
  OPEN:        ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      [],
};
