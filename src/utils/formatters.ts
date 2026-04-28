import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { TicketStatus, SensorType } from '../types';

export const formatDate = (iso: string) =>
  format(parseISO(iso), 'dd MMM yyyy, HH:mm');

export const formatDateShort = (iso: string) =>
  format(parseISO(iso), 'dd MMM yyyy');

export const formatRelative = (iso: string) =>
  formatDistanceToNow(parseISO(iso), { addSuffix: true });

export const formatRms = (v: number) => v.toFixed(2);
export const formatTemp = (v: number) => `${v.toFixed(1)}°C`;

export const ticketStatusLabel: Record<TicketStatus, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
};

export const ticketStatusColors: Record<TicketStatus, string> = {
  OPEN:        'bg-red-100 text-red-700 border-red-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED:      'bg-slate-100 text-slate-600 border-slate-200',
};

export const sensorTypeLabel: Record<SensorType, string> = {
  VIBRATION:   'Vibration',
  TEMPERATURE: 'Temperature',
  COMBINED:    'Combined',
};

export const sensorTypeColors: Record<SensorType, string> = {
  VIBRATION:   'bg-violet-100 text-violet-700 border-violet-200',
  TEMPERATURE: 'bg-orange-100 text-orange-700 border-orange-200',
  COMBINED:    'bg-sky-100 text-sky-700 border-sky-200',
};

// Allowed ticket transitions — mirrors the backend state machine
export const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN:        ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      [],
};
