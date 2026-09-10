import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Wifi, RefreshCw, Shield, Info, Moon, Sun, Monitor, Download, CheckCircle, AlertCircle, Sliders } from 'lucide-react';

const DEFAULTS = {
  delayAlerts: true,
  etaUpdates: true,
  onTimeAlerts: false,
  autoRefresh: true,
  demoMode: true,
  highFrequency: false,
  analytics: true,
  cacheHistory: true,
  theme: 'system',
  refreshInterval: '30',
};

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('raileta_settings') || '{}');
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [apiStatus, setApiStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('raileta_settings', JSON.stringify(settings));
    // Apply theme
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings]);

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const testApi = async () => {
    setApiStatus('testing');
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      setApiStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setApiStatus('fail');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark',  label: 'Dark',  icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const refreshOptions = ['10', '30', '60'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure RailETA preferences — all settings are saved automatically</p>
      </div>

      {/* Theme Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Moon size={16} className="text-indigo-600" />
          </div>
          <h2 className="font-bold text-slate-800">Appearance</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Theme</p>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => set('theme', value)}
                className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                  settings.theme === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Refresh Interval */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Sliders size={16} className="text-green-600" />
          </div>
          <h2 className="font-bold text-slate-800">Refresh Interval</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-slate-700 mb-1">Auto-refresh every</p>
          <p className="text-xs text-slate-400 mb-3">How often live train data is re-fetched</p>
          <div className="flex gap-2">
            {refreshOptions.map(v => (
              <button
                key={v}
                onClick={() => set('refreshInterval', v)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                  settings.refreshInterval === v
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {v}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Bell size={16} className="text-blue-600" />
          </div>
          <h2 className="font-bold text-slate-800">Notifications</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { key: 'delayAlerts', label: 'Delay Alerts', desc: 'Get notified when train delay exceeds threshold' },
            { key: 'etaUpdates',  label: 'ETA Updates',  desc: 'Receive updated ETA for tracked trains' },
            { key: 'onTimeAlerts',label: 'On-Time Alerts',desc: 'Alert when train returns to schedule' },
          ].map(item => (
            <div key={item.key} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <Toggle checked={!!settings[item.key]} onChange={v => set(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Data & Refresh */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <RefreshCw size={16} className="text-green-600" />
          </div>
          <h2 className="font-bold text-slate-800">Data & Refresh</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { key: 'autoRefresh',   label: 'Auto-Refresh',      desc: `Refresh train data every ${settings.refreshInterval} seconds` },
            { key: 'demoMode',      label: 'Demo Mode',          desc: 'Use mock data when backend is unavailable' },
            { key: 'highFrequency', label: 'High Frequency (β)', desc: 'Increase refresh to 10 seconds (beta)' },
          ].map(item => (
            <div key={item.key} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <Toggle checked={!!settings[item.key]} onChange={v => set(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Shield size={16} className="text-purple-600" />
          </div>
          <h2 className="font-bold text-slate-800">Privacy & Security</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { key: 'analytics',    label: 'Anonymous Analytics', desc: 'Help improve predictions with anonymous usage data' },
            { key: 'cacheHistory', label: 'Cache History',        desc: 'Store recently searched trains locally' },
          ].map(item => (
            <div key={item.key} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <Toggle checked={!!settings[item.key]} onChange={v => set(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold text-slate-800 mb-1">Quick Actions</h2>

        {/* API Connection Test */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium text-slate-700">Test API Connection</p>
            <p className="text-xs text-slate-400">Verify backend is reachable</p>
          </div>
          <div className="flex items-center gap-2">
            {apiStatus === 'ok' && <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><CheckCircle size={13}/> Connected</span>}
            {apiStatus === 'fail' && <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><AlertCircle size={13}/> Failed</span>}
            <button
              onClick={testApi}
              disabled={apiStatus === 'testing'}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60"
            >
              {apiStatus === 'testing' ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
              {apiStatus === 'testing' ? 'Testing…' : 'Test Now'}
            </button>
          </div>
        </div>

        {/* Install App */}
        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Install as App</p>
            <p className="text-xs text-slate-400">Add RailETA to home screen / desktop</p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('raileta:show-install'))}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <Download size={12} /> Install App
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Info size={16} className="text-blue-600" />
          <h2 className="font-bold text-slate-800">About RailETA</h2>
        </div>
        <p className="text-sm text-slate-600 mb-2">Version 1.0.0 · SIH 2026 Prototype</p>
        <p className="text-xs text-slate-500">
          RailETA uses a multi-factor AI/ML prediction engine to forecast Indian Railway coaching train arrival times.
          Built with React + Vite + Tailwind CSS (frontend) and FastAPI + SQLite (backend).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['React', 'Vite', 'FastAPI', 'SQLite', 'Recharts', 'Tailwind CSS', 'Scikit-learn'].map(t => (
            <span key={t} className="text-[10px] font-medium px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded-full">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
