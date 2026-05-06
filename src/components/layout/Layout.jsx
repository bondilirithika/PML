import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const SIDEBAR_OPEN_W   = 232;
const SIDEBAR_CLOSED_W = 64;

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarW = sidebarOpen ? SIDEBAR_OPEN_W : SIDEBAR_CLOSED_W;

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Sidebar open={sidebarOpen} />

      {/* Toggle tab — lives outside the aside so overflow:hidden doesn't clip it */}
      <button
        onClick={() => setSidebarOpen(o => !o)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="fixed top-1/2 z-40 flex items-center justify-center rounded-r-xl transition-all duration-300"
        style={{
          left: sidebarW - 1,
          transform: 'translateY(-50%)',
          width: 20,
          height: 48,
          background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '3px 0 16px rgba(99,102,241,0.5)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.width = '26px';
          e.currentTarget.style.boxShadow = '4px 0 22px rgba(99,102,241,0.7)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.width = '20px';
          e.currentTarget.style.boxShadow = '3px 0 16px rgba(99,102,241,0.5)';
        }}
      >
        {sidebarOpen
          ? <ChevronLeft  className="w-3 h-3 text-white" />
          : <ChevronRight className="w-3 h-3 text-white" />
        }
      </button>

      <Header sidebarW={sidebarW} />

      <main
        className="pt-[65px] min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarW }}
      >
        <div className="p-4 md:p-7 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
