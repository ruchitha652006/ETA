import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Train, Home, Radio, Search, History, Settings, ChevronRight,
  TrendingUp, AlertTriangle
} from 'lucide-react';
import { getMockStatus, MOCK_STATUS } from '../data/mockData';

const navItems = [
  { label: 'Home',          icon: Home,       path: '/' },
  { label: 'Live Tracking', icon: Radio,       path: '/live-tracking' },
  { label: 'ETA Prediction',icon: TrendingUp,  path: '/eta-prediction' },
  { label: 'Train Search',  icon: Search,      path: '/train-search' },
  { label: 'History',       icon: History,     path: '/history' },
  { label: 'Settings',      icon: Settings,    path: '/settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [delayedCount, setDelayedCount] = useState(0);
  const [totalTracked] = useState(5);

  // Compute delayed train count from mock data
  useEffect(() => {
    const trains = Object.values(MOCK_STATUS || {});
    const delayed = trains.filter(t => (t.live?.current_delay_minutes || 0) > 0);
    setDelayedCount(delayed.length);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-0 lg:w-20 overflow-hidden' : 'w-72'}
        `}
        style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d2045 50%, #0a1628 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10 min-h-[80px]">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Train size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-xl tracking-tight leading-none">RailETA</h1>
              <p className="text-blue-300/70 text-[10px] mt-0.5 leading-tight">Smarter ETAs. Happier Journeys.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          {!collapsed && (
            <p className="text-blue-400/50 text-[10px] font-semibold uppercase tracking-widest mb-3 px-3">
              Navigation
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, path }) => {
              const active = location.pathname === path;
              const isLiveTracking = path === '/live-tracking';
              return (
                <li key={path}>
                  <button
                    onClick={() => { navigate(path); if (window.innerWidth < 1024) setCollapsed(true); }}
                    title={collapsed ? label : ''}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                      transition-all duration-200 group relative
                      ${active
                        ? 'bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-400 rounded-r-full" />
                    )}
                    <div className="relative flex-shrink-0">
                      <Icon size={18} className={active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                      {/* Delay badge on Live Tracking */}
                      {isLiveTracking && delayedCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                          {delayedCount}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{label}</span>
                        {/* Inline badge text when expanded */}
                        {isLiveTracking && delayedCount > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle size={8} />{delayedCount} delayed
                          </span>
                        )}
                        {active && !isLiveTracking && <ChevronRight size={14} className="text-blue-400" />}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Status Badge + Mini Stats */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-white/10 space-y-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">System Live</span>
              </div>
              <p className="text-slate-400 text-[10px]">AI Prediction Engine Active</p>
              {/* Mini stats strip */}
              <div className="flex gap-4 mt-2 pt-2 border-t border-white/10">
                <div className="text-center">
                  <p className="text-white text-sm font-black">{totalTracked}</p>
                  <p className="text-slate-500 text-[9px]">Tracked</p>
                </div>
                <div className="text-center">
                  <p className={`text-sm font-black ${delayedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{delayedCount}</p>
                  <p className="text-slate-500 text-[9px]">Delayed</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-400 text-sm font-black">{totalTracked - delayedCount}</p>
                  <p className="text-slate-500 text-[9px]">On Time</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
