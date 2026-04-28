import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../api/tickets';
import { format } from 'date-fns';

const routeMeta: Record<string, { title: string; subtitle: string; crumb: string }> = {
  '/':           { title: 'Dashboard',     subtitle: 'System overview and live metrics',        crumb: 'Dashboard' },
  '/assets':     { title: 'Assets',        subtitle: 'Manage your monitored equipment',         crumb: 'Assets' },
  '/sensors':    { title: 'Sensors',       subtitle: 'IoT devices attached to assets',          crumb: 'Sensors' },
  '/readings':   { title: 'Readings',      subtitle: 'Raw sensor telemetry data',               crumb: 'Readings' },
  '/thresholds': { title: 'Thresholds',    subtitle: 'Configure alert limits per asset',        crumb: 'Thresholds' },
  '/tickets':    { title: 'Tickets',       subtitle: 'Maintenance alerts and work orders',      crumb: 'Tickets' },
  '/simulator':  { title: 'IoT Simulator', subtitle: 'Publish device payloads manually',       crumb: 'Simulator' },
};

export function Header() {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? { title: 'PML System', subtitle: '', crumb: 'Home' };

  const { data } = useQuery({
    queryKey: ['tickets', 'count'],
    queryFn:  ticketsApi.countOpen,
    refetchInterval: 30000,
  });

  const openCount = data?.openTickets ?? 0;
  const today = format(new Date(), 'EEE, d MMM yyyy');

  return (
    <header
      className="fixed top-0 left-[232px] right-0 h-[65px] z-20 flex items-center justify-between px-7 glass-header"
    >
      {/* Left — breadcrumb + page title */}
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-semibold text-slate-400">PML</span>
          <span className="text-[11px] text-slate-300">/</span>
          <span className="text-[11px] font-semibold text-indigo-500">{meta.crumb}</span>
        </div>
        <h2 className="text-[15px] font-extrabold text-slate-900 leading-none tracking-tight">
          {meta.title}
        </h2>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Live date chip */}
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl mr-1"
          style={{
            background: 'white',
            border: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          />
          <span className="text-xs font-semibold text-slate-600">{today}</span>
        </div>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-150"
          style={{
            background: 'white',
            border: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Bell className="w-[17px] h-[17px]" />
          {openCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 0 0 2px #f8fafc',
              }}
            >
              {openCount > 9 ? '9+' : openCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Avatar */}
        <button
          className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl transition-all duration-150 hover:bg-white"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(226,232,240,0.8)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.border = '1px solid transparent';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
            }}
          >
            CG
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[12px] font-bold text-slate-800 leading-none">Cognizant</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Engineer</p>
          </div>
        </button>
      </div>
    </header>
  );
}
