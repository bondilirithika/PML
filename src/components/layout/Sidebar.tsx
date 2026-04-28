import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Server,
  Cpu,
  Activity,
  SlidersHorizontal,
  Ticket,
  Radio,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/assets',     label: 'Assets',     icon: Server },
  { to: '/sensors',    label: 'Sensors',    icon: Cpu },
  { to: '/readings',   label: 'Readings',   icon: Activity },
  { to: '/thresholds', label: 'Thresholds', icon: SlidersHorizontal },
  { to: '/tickets',    label: 'Tickets',    icon: Ticket },
  { to: '/simulator',  label: 'IoT Simulator', icon: Radio },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-none">PML System</p>
          <p className="text-slate-500 text-xs mt-0.5">Predictive Maintenance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          Main Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={clsx('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-slate-600 text-xs">Cognizant © 2026</p>
        <p className="text-slate-700 text-xs mt-0.5">Spring Boot 4.0 · React 18</p>
      </div>
    </aside>
  );
}
