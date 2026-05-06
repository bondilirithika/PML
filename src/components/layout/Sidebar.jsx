import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Server, Cpu, Activity,
  Ticket, Radio, SlidersHorizontal, Zap, LogOut, Users as UsersIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const mainNav = [
  { to: '/',           label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/assets',     label: 'Assets',        icon: Server },
  { to: '/sensors',    label: 'Sensors',       icon: Cpu },
  { to: '/readings',   label: 'Readings',      icon: Activity },
];

const monitorNav = [
  { to: '/tickets',    label: 'Tickets',       icon: Ticket },
  { to: '/thresholds', label: 'Thresholds',    icon: SlidersHorizontal, writeOnly: true },
  { to: '/simulator',  label: 'IoT Simulator', icon: Radio,             writeOnly: true },
];

const adminNav = [
  { to: '/users', label: 'Users', icon: UsersIcon },
];

function NavItem({ to, label, icon: Icon, collapsed }) {
  return (
    <NavLink to={to} end={to === '/'} title={collapsed ? label : undefined}>
      {({ isActive }) => (
        <div
          className={clsx(
            'relative flex items-center rounded-xl cursor-pointer select-none transition-colors duration-150',
            collapsed
              ? 'justify-center mx-auto'
              : 'gap-3 px-3 py-2.5',
            isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'
          )}
          style={{
            ...(collapsed ? { width: 40, height: 40 } : {}),
            ...(isActive ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            } : {}),
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
        >
          {isActive && !collapsed && (
            <span className="absolute left-0 top-[20%] w-[3px] rounded-r-full"
              style={{ height: '60%', background: 'rgba(255,255,255,0.6)' }} />
          )}

          <Icon className={clsx(
            'flex-shrink-0 transition-colors duration-150',
            collapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]',
            isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
          )} />

          {!collapsed && (
            <>
              <span className="flex-1 text-[13px] truncate">{label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.6)' }} />}
            </>
          )}
        </div>
      )}
    </NavLink>
  );
}

function NavSection({ items, label, canWrite, collapsed }) {
  const visible = items.filter(i => !i.writeOnly || canWrite);
  if (!visible.length) return null;

  return (
    <div className="mb-4">
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap"
            style={{ color: 'rgba(148,163,184,0.4)' }}>
            {label}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      )}
      <ul className={clsx('space-y-0.5', collapsed && 'flex flex-col items-center')}>
        {visible.map(item => (
          <li key={item.to} className={collapsed ? 'w-full flex justify-center' : ''}>
            <NavItem {...item} collapsed={collapsed} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ open }) {
  const { logout, canWrite, isAdmin } = useAuth();
  const collapsed = !open;

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 flex flex-col z-30 transition-all duration-300 overflow-hidden',
        collapsed ? 'w-[64px]' : 'w-[232px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #0f172a 60%, #0d1117 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Ambient top glow */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

      {/* Brand */}
      <div
        className="relative flex items-center h-[65px] flex-shrink-0 px-[12px] gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 24px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Zap style={{ width: 18, height: 18 }} className="text-white" />
        </div>

        <div className={clsx(
          'overflow-hidden transition-all duration-300 whitespace-nowrap',
          collapsed ? 'w-0 opacity-0' : 'opacity-100'
        )}>
          <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'rgba(148,163,184,0.5)' }}>
            Predictive
          </p>
          <p className="text-[13px] font-semibold leading-tight" style={{ color: 'rgba(226,232,240,0.85)' }}>
            Maintenance
          </p>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-px flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.5), transparent)' }} />

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden pt-5 relative z-10 px-3"
        style={{ scrollbarWidth: 'none' }}
      >
        <NavSection items={mainNav}    label="Overview" collapsed={collapsed} />

        {/* Separator between sections when collapsed */}
        {collapsed && (
          <div className="flex justify-center my-2">
            <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
        )}

        <NavSection items={monitorNav} label="Monitor" canWrite={canWrite} collapsed={collapsed} />
        {isAdmin && <NavSection items={adminNav} label="Admin" collapsed={collapsed} />}
      </nav>

      {/* Bottom ambient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(99,102,241,0.06) 0%, transparent 100%)' }} />

      {/* Sign out */}
      <div className={clsx('relative z-10 mb-5 flex-shrink-0 px-3', collapsed && 'flex justify-center')}>
        <button
          onClick={logout}
          title="Sign Out"
          className={clsx(
            'flex items-center rounded-xl transition-all duration-200 text-slate-500 hover:text-red-400',
            collapsed ? 'justify-center' : 'w-full gap-3 px-3.5 py-2.5'
          )}
          style={{
            ...(collapsed ? { width: 40, height: 40 } : {}),
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.09)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-[13px] font-semibold">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
