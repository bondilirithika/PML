import { useLocation } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../api/tickets';
import { useAuth } from '../../context/AuthContext';
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

  const { user, logout, isAdmin, isManager } = useAuth();

  const { data } = useQuery({
    queryKey: ['tickets', 'count'],
    queryFn:  ticketsApi.countOpen,
    refetchInterval: 30000,
  });

  const openCount = data?.openTickets ?? 0;
  const today = format(new Date(), 'EEE, d MMM yyyy');

  const rolePillStyle = isAdmin
    ? { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', label: 'Admin' }
    : isManager
    ? { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', label: 'Manager' }
    : { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', label: 'Technician' };

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

        {/* Avatar + user info + logout */}
        <div className="flex items-center gap-2">
          {/* Avatar + user info */}
          <div className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl"
            style={{ background: 'white', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
              {user?.username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[12px] font-bold text-slate-800 leading-none">{user?.username}</p>
              <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: rolePillStyle.bg, color: rolePillStyle.color, border: rolePillStyle.border }}>
                {rolePillStyle.label}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-all duration-150"
            style={{ background: 'white', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <LogOut className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
