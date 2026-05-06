import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const SIDEBAR_OPEN_W  = 232;
const SIDEBAR_CLOSED_W = 64;

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarW = sidebarOpen ? SIDEBAR_OPEN_W : SIDEBAR_CLOSED_W;

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

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
