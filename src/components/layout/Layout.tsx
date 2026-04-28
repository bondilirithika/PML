import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Sidebar />
      <Header />
      <main className="ml-[232px] pt-[65px] min-h-screen">
        <div className="p-7 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
