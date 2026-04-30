import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider }      from './context/AuthContext';
import { ProtectedRoute }    from './components/auth/ProtectedRoute';
import { Layout }            from './components/layout/Layout';
import { Login }             from './pages/Login';
import { Dashboard }  from './pages/Dashboard';
import { Assets }     from './pages/Assets';
import { Sensors }    from './pages/Sensors';
import { Readings }   from './pages/Readings';
import { Tickets }    from './pages/Tickets';
import { Simulator }   from './pages/Simulator';
import { Users }       from './pages/Users';
import { Thresholds }  from './pages/Thresholds';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index           element={<Dashboard />} />
                <Route path="assets"   element={<Assets />}    />
                <Route path="sensors"  element={<Sensors />}   />
                <Route path="readings" element={<Readings />}  />
                <Route path="tickets"  element={<Tickets />}   />
                <Route path="simulator"  element={<Simulator />}  />
                <Route path="users"      element={<Users />}      />
                <Route path="thresholds" element={<Thresholds />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: '500',
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
