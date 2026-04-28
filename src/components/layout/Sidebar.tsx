import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Server, Cpu, Activity,
  SlidersHorizontal, Ticket, Radio, Zap,
} from 'lucide-react';

const mainNav = [
  { to: '/',           label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/assets',     label: 'Assets',        icon: Server },
  { to: '/sensors',    label: 'Sensors',       icon: Cpu },
  { to: '/readings',   label: 'Readings',      icon: Activity },
];

const monitorNav = [
  { to: '/thresholds', label: 'Thresholds',    icon: SlidersHorizontal },
  { to: '/tickets',    label: 'Tickets',       icon: Ticket },
  { to: '/simulator',  label: 'IoT Simulator', icon: Radio },
];

function NavSection({ items, label }: { items: typeof mainNav; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ to, label: navLabel, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'}>
              {({ isActive }) => (
                <div className={clsx('nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive')}>
                  <Icon
                    className={clsx(
                      'w-[17px] h-[17px] flex-shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-500'
                    )}
                  />
                  <span className={clsx('flex-1', isActive ? 'text-white' : 'text-slate-400')}>{navLabel}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  )}
                </div>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside
      className="fixed inset-y-0 left-0 w-[232px] flex flex-col z-30"
      style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 h-[65px] flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 20px rgba(99,102,241,0.5)',
          }}
        >
          <Zap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <p className="font-extrabold leading-none tracking-tight" style={{ color: '#f8fafc', fontSize: 14 }}>
            PML System
          </p>
          <p className="mt-0.5 font-medium" style={{ color: 'rgba(148,163,184,0.7)', fontSize: 11 }}>
            Predictive Maintenance
          </p>
        </div>
      </div>

      {/* Decorative gradient bar */}
      <div
        className="h-px flex-shrink-0 opacity-20"
        style={{ background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)' }}
      />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-6">
        <NavSection items={mainNav}    label="Overview" />
        <NavSection items={monitorNav} label="Monitor"  />
      </nav>

      {/* System status */}
      <div
        className="mx-3 mb-4 rounded-2xl p-3.5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: '#34d399', animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#10b981' }} />
          </span>
          <p className="text-xs font-bold" style={{ color: '#34d399' }}>System Online</p>
        </div>
        <p className="text-[10px] font-medium" style={{ color: 'rgba(100,116,139,0.8)' }}>
          Spring Boot 4.0 · MySQL · React 18
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(100,116,139,0.5)' }}>
          Cognizant © 2026
        </p>
      </div>
    </aside>
  );
}
