import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-1/2 left-0 z-40 -translate-y-1/2 flex items-center justify-center w-5 h-12 rounded-r-lg transition-all duration-200 hover:w-7"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '2px 0 12px rgba(99,102,241,0.4)',
          }}
          title="Open sidebar"
        >
          <ChevronRight className="w-3 h-3 text-white" />
        </button>
      )}

      <Header sidebarOpen={sidebarOpen} />

      <main
        className="pt-[65px] min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 232 : 0 }}
      >
        <div className="p-4 md:p-7 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
