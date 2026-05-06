import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Server, Cpu, Activity,
  Ticket, Radio, SlidersHorizontal, Zap, LogOut,
  ChevronLeft, ChevronRight, Users as UsersIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const mainNav = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/assets',     label: 'Assets',     icon: Server },
  { to: '/sensors',    label: 'Sensors',    icon: Cpu },
  { to: '/readings',   label: 'Readings',   icon: Activity },
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
    <NavLink to={to} end={to === '/'} title={label}>
      {({ isActive }) => (
        <div
          className={clsx(
            'relative flex items-center rounded-xl cursor-pointer select-none group',
            'transition-all duration-200',
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5',
            isActive
              ? 'text-white font-semibold'
              : 'text-slate-400 hover:text-slate-100'
          )}
          style={isActive ? {
            background: 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
          } : undefined}
          onMouseEnter={e => {
            if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={e => {
            if (!isActive) e.currentTarget.style.background = '';
          }}
        >
          {/* Active left accent */}
          {isActive && !collapsed && (
            <span
              className="absolute left-0 top-[20%] w-[3px] rounded-r-full"
              style={{ height: '60%', background: 'rgba(255,255,255,0.6)' }}
            />
          )}

          <Icon
            className={clsx(
              'flex-shrink-0 transition-colors duration-200',
              collapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]',
              isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
            )}
          />

          {!collapsed && (
            <>
              <span className="flex-1 text-[13px] truncate">{label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.6)' }} />
              )}
            </>
          )}
        </div>
      )}
    </NavLink>
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) {
    return (
      <div className="flex justify-center mb-2 mt-1">
        <div className="w-5 h-px" style={{ background: 'rgba(99,102,241,0.3)' }} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 mb-2">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap"
        style={{ color: 'rgba(148,163,184,0.45)' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

function NavSection({ items, label, canWrite, collapsed }) {
  const visible = items.filter(i => !i.writeOnly || canWrite);
  if (!visible.length) return null;
  return (
    <div className="mb-5">
      <SectionLabel collapsed={collapsed}>{label}</SectionLabel>
      <ul className="space-y-0.5">
        {visible.map(item => (
          <li key={item.to}>
            <NavItem {...item} collapsed={collapsed} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ open, onToggle }) {
  const { logout, canWrite, isAdmin } = useAuth();
  const collapsed = !open;

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 flex flex-col z-30 transition-all duration-300 overflow-visible',
        collapsed ? 'w-[64px]' : 'w-[232px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #0f172a 60%, #0d1117 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Brand */}
      <div
        className={clsx(
          'relative flex items-center h-[65px] flex-shrink-0 transition-all duration-300',
          collapsed ? 'justify-center px-0' : 'px-5 gap-3'
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 24px rgba(99,102,241,0.55), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Zap style={{ width: 18, height: 18 }} className="text-white" />
        </div>

        <div
          className={clsx(
            'overflow-hidden transition-all duration-300 whitespace-nowrap',
            collapsed ? 'w-0 opacity-0' : 'opacity-100'
          )}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'rgba(148,163,184,0.5)' }}>
            Predictive
          </p>
          <p className="text-[13px] font-semibold leading-tight" style={{ color: 'rgba(226,232,240,0.85)' }}>
            Maintenance
          </p>
        </div>
      </div>

      {/* Accent line */}
      <div
        className="h-px flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.5), transparent)' }}
      />

      {/* Nav */}
      <nav
        className={clsx(
          'flex-1 overflow-y-auto overflow-x-hidden pt-5 relative z-10',
          collapsed ? 'px-[10px]' : 'px-3'
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        <NavSection items={mainNav}    label="Overview" collapsed={collapsed} />
        <NavSection items={monitorNav} label="Monitor"  canWrite={canWrite} collapsed={collapsed} />
        {isAdmin && <NavSection items={adminNav} label="Admin" collapsed={collapsed} />}
      </nav>

      {/* Bottom ambient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(99,102,241,0.06) 0%, transparent 100%)' }}
      />

      {/* Sign out */}
      <div className={clsx('relative z-10 mb-4 flex-shrink-0', collapsed ? 'flex justify-center' : 'px-3')}>
        <button
          onClick={logout}
          title="Sign Out"
          className={clsx(
            'flex items-center gap-3 rounded-xl transition-all duration-200 text-slate-500 hover:text-red-400',
            collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3.5 py-2.5'
          )}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.09)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(239,68,68,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-[13px] font-semibold">Sign Out</span>}
        </button>
      </div>

      {/* Toggle tab */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expand' : 'Collapse'}
        className="absolute top-1/2 -translate-y-1/2 -right-[13px] z-50 flex items-center justify-center rounded-r-[10px] transition-all duration-200 group"
        style={{
          width: 26,
          height: 48,
          background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '4px 0 18px rgba(99,102,241,0.5), inset -1px 0 0 rgba(255,255,255,0.1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.width = '32px';
          e.currentTarget.style.boxShadow = '4px 0 24px rgba(99,102,241,0.7), inset -1px 0 0 rgba(255,255,255,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.width = '26px';
          e.currentTarget.style.boxShadow = '4px 0 18px rgba(99,102,241,0.5), inset -1px 0 0 rgba(255,255,255,0.1)';
        }}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-white/90" />
          : <ChevronLeft  className="w-3 h-3 text-white/90" />
        }
      </button>
    </aside>
  );
}
