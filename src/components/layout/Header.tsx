import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
}

const routeMeta: Record<string, { title: string; crumb: string }> = {
  '/':          { title: 'Dashboard',     crumb: 'Dashboard' },
  '/assets':    { title: 'Assets',        crumb: 'Assets' },
  '/sensors':   { title: 'Sensors',       crumb: 'Sensors' },
  '/readings':  { title: 'Readings',      crumb: 'Readings' },
  '/tickets':   { title: 'Tickets',       crumb: 'Tickets' },
  '/simulator': { title: 'IoT Simulator', crumb: 'Simulator' },
};

export function Header({ sidebarOpen }: HeaderProps) {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? { title: 'PML System', crumb: 'Home' };
  const { user, isAdmin, isManager } = useAuth();

  const avatarGradient = isAdmin
    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    : isManager
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'linear-gradient(135deg, #f59e0b, #d97706)';

  const avatarGlow = isAdmin
    ? 'rgba(99,102,241,0.4)'
    : isManager
    ? 'rgba(16,185,129,0.4)'
    : 'rgba(245,158,11,0.4)';

  return (
    <header
      className="fixed top-0 right-0 h-[65px] z-20 flex items-center justify-between px-6 glass-header transition-all duration-300"
      style={{ left: sidebarOpen ? 232 : 0 }}
    >
      {/* Left — breadcrumb */}
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

      {/* Right — avatar only */}
      <div
        className="flex items-center gap-2.5 group cursor-default select-none"
        title={`${user?.username} · ${isAdmin ? 'Admin' : isManager ? 'Manager' : 'Technician'}`}
      >
        {/* Username — subtle, hidden on small screens */}
        <span className="hidden sm:block text-[13px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
          {user?.username}
        </span>

        {/* Avatar circle */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-black flex-shrink-0 transition-all duration-200"
          style={{
            background: avatarGradient,
            boxShadow: `0 2px 10px ${avatarGlow}`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${avatarGlow.replace('0.4)', '0.6)')}`;
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 10px ${avatarGlow}`;
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          }}
        >
          {user?.username?.charAt(0).toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
