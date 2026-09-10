import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import LiveTracking from './pages/LiveTracking';
import ETAPrediction from './pages/ETAPrediction';
import TrainSearch from './pages/TrainSearch';
import History from './pages/History';
import Settings from './pages/Settings';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend availability
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72';

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        <div className={`transition-all duration-300 ${sidebarWidth}`}>
          <Header
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            backendOnline={backendOnline}
          />
          <main className="p-4 lg:p-6 min-h-[calc(100vh-64px)]">
            <Routes>
              <Route path="/"               element={<Home           backendOnline={backendOnline} />} />
              <Route path="/live-tracking"  element={<LiveTracking   backendOnline={backendOnline} />} />
              <Route path="/eta-prediction" element={<ETAPrediction  backendOnline={backendOnline} />} />
              <Route path="/train-search"   element={<TrainSearch    backendOnline={backendOnline} />} />
              <Route path="/history"        element={<History        backendOnline={backendOnline} />} />
              <Route path="/settings"       element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
