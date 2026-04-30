import type React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Server, Cpu, Activity,
  Ticket, Radio, Zap, LogOut, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

type NavItem = { to: string; label: string; icon: React.ElementType; writeOnly?: boolean };

const mainNav: NavItem[] = [
  { to: '/',           label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/assets',     label: 'Assets',        icon: Server },
  { to: '/sensors',    label: 'Sensors',       icon: Cpu },
  { to: '/readings',   label: 'Readings',      icon: Activity },
];

const monitorNav: NavItem[] = [
  { to: '/tickets',   label: 'Tickets',       icon: Ticket },
  { to: '/simulator', label: 'IoT Simulator', icon: Radio,  writeOnly: true },
];

function NavSection({ items, label, canWrite }: { items: NavItem[]; label: string; canWrite?: boolean }) {
  const visible = items.filter(item => !item.writeOnly || canWrite);
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2"
        style={{ color: 'rgba(148,163,184,0.5)' }}>
        {label}
      </p>
      <ul className="space-y-0.5">
        {visible.map(({ to, label: navLabel, icon: Icon }) => (
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
                  <span className={clsx('flex-1 truncate', isActive ? 'text-white' : 'text-slate-400')}>
                    {navLabel}
                  </span>
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

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { logout, canWrite } = useAuth();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 w-[232px] flex flex-col z-30 transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Brand row */}
      <div
        className="flex items-center justify-between px-5 h-[65px] flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.5)',
            }}
          >
            <Zap style={{ width: 18, height: 18 }} className="text-white" />
          </div>
          <p
            className="font-semibold tracking-wide leading-none"
            style={{ color: 'rgba(148,163,184,0.75)', fontSize: 12, letterSpacing: '0.05em' }}
          >
            Predictive Maintenance
          </p>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Decorative gradient bar */}
      <div
        className="h-px flex-shrink-0 opacity-20"
        style={{ background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)' }}
      />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-6">
        <NavSection items={mainNav}    label="Overview" />
        <NavSection items={monitorNav} label="Monitor" canWrite={canWrite} />
      </nav>

      {/* Bottom — sign out only */}
      <div className="mx-3 mb-5 flex-shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-red-400 transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-[13px] font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
