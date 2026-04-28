import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { Dashboard }  from './pages/Dashboard';
import { Assets }     from './pages/Assets';
import { Sensors }    from './pages/Sensors';
import { Readings }   from './pages/Readings';
import { Thresholds } from './pages/Thresholds';
import { Tickets }    from './pages/Tickets';
import { Simulator }  from './pages/Simulator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 60 seconds before it's considered stale
      staleTime: 60_000,
      // Retry failed requests once before surfacing an error
      retry: 1,
      // Don't refetch when the window regains focus (too noisy for this app)
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index        element={<Dashboard />}  />
            <Route path="assets"     element={<Assets />}     />
            <Route path="sensors"    element={<Sensors />}    />
            <Route path="readings"   element={<Readings />}   />
            <Route path="thresholds" element={<Thresholds />} />
            <Route path="tickets"    element={<Tickets />}    />
            <Route path="simulator"  element={<Simulator />}  />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Toast notifications — top-right, enterprise style */}
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
    </QueryClientProvider>
  );
}

export default App;
