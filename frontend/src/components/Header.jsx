import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Menu, Train, X, ChevronDown, Wifi, WifiOff, Download, Smartphone, CheckCircle, Monitor } from 'lucide-react';
import { searchTrains } from '../services/api';
import { MOCK_TRAINS } from '../data/mockData';
import LiveClock from './LiveClock';

export default function Header({ sidebarCollapsed, setSidebarCollapsed, backendOnline }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Listen for PWA install event
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsAppInstalled(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const notifications = [
    { id: 1, msg: '12723 Telangana Express — 18 min delay', time: '2m ago', type: 'warning' },
    { id: 2, msg: '17201 Golconda Express — Major delay (32 min)', time: '8m ago', type: 'danger' },
    { id: 3, msg: 'Prediction confidence updated for 12759', time: '15m ago', type: 'info' },
  ];

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = backendOnline ? await searchTrains(query) : MOCK_TRAINS.filter(
          t => t.train_no.includes(query) || t.train_name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(data.slice(0, 6));
        setShowDropdown(true);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, backendOnline]);

  const handleSelect = (train) => {
    setQuery('');
    setShowDropdown(false);
    navigate(`/?train=${train.train_no}`);
  };

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 lg:px-6 py-3 flex items-center gap-4">
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search train number or name..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {searching && (
            <div className="absolute right-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            {results.map(t => (
              <button
                key={t.train_no}
                onClick={() => handleSelect(t)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Train size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.train_no} – {t.train_name}</p>
                  <p className="text-xs text-slate-500">{t.from_station} → {t.to_station}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Live Date and Time */}
        <div className="hidden md:block">
          <LiveClock variant="header" />
        </div>
        <div className="block md:hidden">
          <LiveClock variant="compact" showTimezone={false} />
        </div>

        {/* Backend status */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          backendOnline
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {backendOnline ? 'API Live' : 'Demo Mode'}
        </div>

        {/* Install App Button */}
        {isAppInstalled ? (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} className="text-emerald-600" />
            <span>App Installed</span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-blue-500/20"
            title="Install RailETA as an App on your device"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                <button onClick={() => setNotifOpen(false)}>
                  <X size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <div className="flex gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'danger' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-xs text-slate-700">{n.msg}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            RJ
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">Rail Admin</p>
            <p className="text-[10px] text-slate-400">SCR Zone</p>
          </div>
        </div>
      </div>

      {/* PWA Install Guidance Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install RailETA App</h3>
                  <p className="text-xs text-slate-500">Run as a standalone application</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-3">
                <Monitor className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Desktop (Windows / Chrome / Edge)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Click the <strong>Install</strong> icon (⊕ or computer icon) in the right side of your browser address bar. Or double-click <code className="bg-white px-1.5 py-0.5 rounded text-blue-800 font-mono text-[11px] border border-blue-200">run_app.bat</code> in the project folder!
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <Smartphone className="text-indigo-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Android (Chrome)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tap the <strong>three dots (⋮)</strong> at the top right of Chrome and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <Smartphone className="text-purple-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">iOS (Safari on iPhone / iPad)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tap the <strong>Share button (square with arrow)</strong> at the bottom of Safari, scroll down, and tap <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
