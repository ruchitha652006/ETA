import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Train, Zap, BarChart2, MapPin, RefreshCw, AlertCircle, ChevronRight, Clock, X } from 'lucide-react';
import { getTrainStatus, getETAPrediction, getDelayHistory } from '../services/api';
import { getMockStatus, getMockPrediction, getMockDelayHistory, MOCK_TRAINS } from '../data/mockData';

import TrainStatusCard from '../components/TrainStatusCard';
import PredictionSummaryCard from '../components/PredictionSummaryCard';
import UpcomingStationsTable from '../components/UpcomingStationsTable';
import RouteMap from '../components/RouteMap';
import DelayTrendChart from '../charts/DelayTrendChart';
import FactorsCard from '../components/FactorsCard';
import TrainDetailsCard from '../components/TrainDetailsCard';
import LiveClock from '../components/LiveClock';
import AIExplanationSuite from '../components/AIExplanationSuite';

const QUICK_TRAINS = [
  { no: '12723', name: 'Telangana Express', route: 'HYB → NLR' },
  { no: '12759', name: 'Charminar Express', route: 'HYB → MAS' },
  { no: '17201', name: 'Golconda Express',  route: 'SC → MAS' },
];

const LIVE_STATS = [
  { label: 'Trains Monitored', value: 5, suffix: '', color: 'text-blue-400' },
  { label: 'Avg Delay Today', value: 18, suffix: ' min', color: 'text-amber-400' },
  { label: 'On-Time Rate', value: 38, suffix: '%', color: 'text-red-400' },
  { label: 'Predictions Run', value: 142, suffix: '', color: 'text-emerald-400' },
];

function AnimatedCounter({ target, suffix, duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}{suffix}</span>;
}

export default function Home({ backendOnline }) {
  const [inputVal, setInputVal] = useState('');
  const [trainNo, setTrainNo] = useState('');
  const [status, setStatus] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [delayHistory, setDelayHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [recentTrains, setRecentTrains] = useState([]);
  const refreshRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load recently tracked trains from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('raileta_recent') || '[]');
      setRecentTrains(stored);
    } catch { setRecentTrains([]); }
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K focuses search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const saveRecent = (no, name) => {
    try {
      const prev = JSON.parse(localStorage.getItem('raileta_recent') || '[]');
      const filtered = prev.filter(t => t.no !== no);
      const updated = [{ no, name: name || no }, ...filtered].slice(0, 5);
      localStorage.setItem('raileta_recent', JSON.stringify(updated));
      setRecentTrains(updated);
    } catch {}
  };

  const fetchTrainData = useCallback(async (no) => {
    if (!no) return;
    setLoading(true);
    setError('');
    try {
      if (backendOnline) {
        const [s, p, h] = await Promise.all([
          getTrainStatus(no),
          getETAPrediction(no),
          getDelayHistory(no),
        ]);
        setStatus(s);
        setPrediction(p);
        setDelayHistory(h);
        saveRecent(no, s?.train_name);
      } else {
        await new Promise(r => setTimeout(r, 700));
        const s = getMockStatus(no);
        if (!s) throw new Error(`Train ${no} not found in demo data. Try: 12723, 12759, or 17201`);
        setStatus(s);
        setPrediction(getMockPrediction(no));
        setDelayHistory(getMockDelayHistory(no));
        saveRecent(no, s?.train_name);
      }
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message || 'Failed to fetch train data');
      setStatus(null);
      setPrediction(null);
    }
    setLoading(false);
  }, [backendOnline]);

  const handleTrack = (no) => {
    const n = (no || inputVal).trim();
    if (!n) return;
    setInputVal(n);
    setTrainNo(n);
    fetchTrainData(n);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!trainNo) return;
    refreshRef.current = setInterval(() => fetchTrainData(trainNo), 30000);
    return () => clearInterval(refreshRef.current);
  }, [trainNo, fetchTrainData]);

  // Pick up ?train= from URL or default to 12723
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('train') || '12723';
    setInputVal(t);
    setTrainNo(t);
    fetchTrainData(t);
  }, []);

  const removeRecent = (no, e) => {
    e.stopPropagation();
    try {
      const updated = recentTrains.filter(t => t.no !== no);
      localStorage.setItem('raileta_recent', JSON.stringify(updated));
      setRecentTrains(updated);
    } catch {}
  };

  const showDashboard = !loading && status && prediction;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0d2045] to-[#1a3a6e] px-6 py-10 md:py-14 shadow-xl">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#ffffff22 1px,transparent 1px),linear-gradient(90deg,#ffffff22 1px,transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <Zap size={14} className="text-blue-400" />
              </div>
              <span className="text-blue-300 text-xs font-semibold tracking-wide uppercase">AI/ML Powered</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">RailETA</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base mb-6">
              Get real-time train status and accurate ETA prediction using AI/ML
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                  placeholder="Enter train number (e.g. 12723)"
                  className="w-full pl-10 pr-20 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[9px] text-slate-400 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 font-mono select-none">
                  <span>Ctrl K</span>
                </kbd>
              </div>
              <button
                onClick={() => handleTrack()}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <RefreshCw size={15} className="animate-spin" />
                  : <><Train size={15} /> Track Train</>
                }
              </button>
            </div>

            {/* Quick select */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-slate-400 text-xs self-center">Quick:</span>
              {QUICK_TRAINS.map(t => (
                <button
                  key={t.no}
                  onClick={() => { setInputVal(t.no); handleTrack(t.no); }}
                  className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 rounded-lg transition-all"
                >
                  {t.no} – {t.name}
                </button>
              ))}
            </div>

            {/* Recently Tracked */}
            {recentTrains.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-slate-500 text-xs self-center flex items-center gap-1">
                  <Clock size={10} /> Recent:
                </span>
                {recentTrains.map(t => (
                  <button
                    key={t.no}
                    onClick={() => { setInputVal(t.no); handleTrack(t.no); }}
                    className="group relative text-xs px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    {t.no}
                    <span
                      onClick={(e) => removeRecent(t.no, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-cyan-400 hover:text-white"
                    >
                      <X size={9} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Promo Cards */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            {[
              { icon: Zap,      label: 'Real-time data',   color: 'text-blue-400',   bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { icon: BarChart2, label: 'Smart prediction', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
              { icon: MapPin,   label: 'Better journeys',  color: 'text-green-400',  bg: 'bg-green-500/10', border: 'border-green-500/20' },
            ].map(({ icon: Icon, label, color, bg, border }) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} ${border}`}>
                <Icon size={16} className={color} />
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Stats Strip */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {LIVE_STATS.map(stat => (
            <div key={stat.label} className="text-center">
              <p className={`text-2xl font-black ${stat.color}`}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      )}

      {/* ── Dashboard ────────────────────────────────────────────────── */}
      {showDashboard && (
        <>
          {/* Refresh bar with Live Clock */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-4 flex-wrap">
              <LiveClock variant="compact" />
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Data sync: <strong className="text-slate-700">{lastRefresh?.toLocaleTimeString() || '—'}</strong>
              </span>
            </div>
            <button
              onClick={() => fetchTrainData(trainNo)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <RefreshCw size={12} /> Refresh Live Status
            </button>
          </div>

          {/* Row 1 – Status + Prediction */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TrainStatusCard status={status} prediction={prediction} />
            </div>
            <PredictionSummaryCard prediction={prediction} />
          </div>

          {/* Row 2 – Advanced Interactive Route Map & GPS Live Tracking */}
          <RouteMap prediction={prediction} status={status} />

          {/* Row 3 – Upcoming Stations Table + Delay Trend */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <UpcomingStationsTable prediction={prediction} />
            <DelayTrendChart prediction={prediction} delayHistory={delayHistory} />
          </div>

          {/* Row 4 – AI Intelligence Suite */}
          <AIExplanationSuite prediction={prediction} status={status} />

          {/* Row 5 – Factors + Train Details */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FactorsCard />
            <TrainDetailsCard status={status} prediction={prediction} />
          </div>
        </>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!showDashboard && !loading && !error && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Train size={28} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Track Your Train</h3>
          <p className="text-slate-500 text-sm mb-5">
            Enter a train number above to see AI-powered ETA predictions
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_TRAINS.map(t => (
              <button
                key={t.no}
                onClick={() => { setInputVal(t.no); handleTrack(t.no); }}
                className="flex items-center gap-2 text-sm px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl font-medium transition-all"
              >
                <Train size={14} />
                {t.no} – {t.name}
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
