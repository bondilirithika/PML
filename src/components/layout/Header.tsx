import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../api/tickets';

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/':           { title: 'Dashboard',     subtitle: 'System overview and live metrics' },
  '/assets':     { title: 'Assets',        subtitle: 'Manage your monitored equipment' },
  '/sensors':    { title: 'Sensors',       subtitle: 'IoT devices attached to assets' },
  '/readings':   { title: 'Readings',      subtitle: 'Raw sensor telemetry data' },
  '/thresholds': { title: 'Thresholds',    subtitle: 'Configure alert limits per asset' },
  '/tickets':    { title: 'Tickets',       subtitle: 'Maintenance alerts and work orders' },
  '/simulator':  { title: 'IoT Simulator', subtitle: 'Publish device payloads manually' },
};

export function Header() {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? { title: 'PML System', subtitle: '' };

  const { data } = useQuery({
    queryKey: ['tickets', 'count'],
    queryFn:  ticketsApi.countOpen,
    refetchInterval: 30000,
  });

  const openCount = data?.openTickets ?? 0;

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 leading-none">{meta.title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Open ticket bell */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {openCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {openCount > 9 ? '9+' : openCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
            CG
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 leading-none">Cognizant</p>
            <p className="text-xs text-slate-500 mt-0.5">Engineer</p>
          </div>
        </div>
      </div>
    </header>
  );
}
