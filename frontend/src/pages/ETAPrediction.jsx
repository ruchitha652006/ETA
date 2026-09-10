import { useState, useEffect } from 'react';
import { Brain, Search, Train, RefreshCw, ChevronRight, Share2, Copy, CheckCheck } from 'lucide-react';
import { getETAPrediction } from '../services/api';
import { getMockPrediction, getMockStatus, MOCK_TRAINS } from '../data/mockData';
import PredictionSummaryCard from '../components/PredictionSummaryCard';
import UpcomingStationsTable from '../components/UpcomingStationsTable';
import DelayTrendChart from '../charts/DelayTrendChart';
import RouteMap from '../components/RouteMap';
import AIExplanationSuite from '../components/AIExplanationSuite';
import LiveClock from '../components/LiveClock';
import { getMockDelayHistory } from '../data/mockData';

// Circular confidence ring
function ConfidenceRing({ confidence = 0 }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;
  const color = confidence >= 75 ? '#22c55e' : confidence >= 50 ? '#f59e0b' : '#ef4444';
  const label = confidence >= 75 ? 'High' : confidence >= 50 ? 'Medium' : 'Low';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: '-70px' }}>
        <span className="text-xl font-black" style={{ color }}>{confidence}%</span>
        <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      </div>
    </div>
  );
}

// Share / Export card
function ShareCard({ prediction }) {
  const [copied, setCopied] = useState(false);

  const buildText = () => {
    if (!prediction) return '';
    const delay = prediction.total_expected_delay ?? 0;
    const eta = prediction.predicted_final_arrival ?? '—';
    return `🚂 RailETA Report — ${prediction.train_no} ${prediction.train_name}
📍 Route: ${prediction.from_station} → ${prediction.to_station}
⏱️ Expected Delay: ${delay > 0 ? `+${delay} min` : 'On Time'}
🕐 Predicted Arrival: ${eta}
📊 Confidence: ${prediction.confidence_score ?? '—'}%
🔗 Powered by RailETA AI/ML System`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Share2 size={16} className="text-blue-600" />
        <h3 className="text-sm font-bold text-slate-800">Share Prediction</h3>
      </div>
      <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-wrap leading-relaxed mb-3 font-sans">
        {buildText()}
      </pre>
      <button
        onClick={handleCopy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          copied
            ? 'bg-emerald-500 text-white'
            : 'bg-slate-900 hover:bg-slate-800 text-white'
        }`}
      >
        {copied ? <><CheckCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy to Clipboard</>}
      </button>
    </div>
  );
}

export default function ETAPrediction({ backendOnline }) {
  const [trainNo, setTrainNo] = useState('12723');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async (explicitNo) => {
    const no = (explicitNo || trainNo).trim();
    if (!no) return;
    if (explicitNo) setTrainNo(explicitNo);
    setLoading(true);
    setError('');
    try {
      const p = backendOnline ? await getETAPrediction(no) : getMockPrediction(no);
      if (!p) throw new Error(`No prediction data for train ${no}. Try: 12723, 12759, or 17201`);
      setPrediction(p);
    } catch (e) {
      const fallback = getMockPrediction(no);
      if (fallback) {
        setPrediction(fallback);
      } else {
        setError(e.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    handlePredict('12723');
  }, [backendOnline]);

  const mockStatus = prediction ? getMockStatus(prediction.train_no) : null;
  const mockHistory = prediction ? getMockDelayHistory(prediction.train_no) : null;
  const confidence = prediction?.confidence_score ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">ETA Prediction & AI Diagnostics</h1>
          <p className="text-slate-500 text-sm mt-1">Multi-factor arrival predictions, anomaly scans, and congestion analysis</p>
        </div>
        <LiveClock variant="compact" />
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: input */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Brain size={18} className="text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Run AI Prediction</h2>
                <p className="text-xs text-slate-500">7-factor weighted ML model with anomaly & congestion radar</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                value={trainNo}
                onChange={e => setTrainNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePredict()}
                placeholder="Enter train number (e.g. 12723)"
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
              />
              <button
                onClick={() => handlePredict()}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <Brain size={15} />}
                Predict ETA
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOCK_TRAINS.slice(0, 3).map(t => (
                <button
                  key={t.train_no}
                  onClick={() => { handlePredict(t.train_no); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    trainNo === t.train_no
                      ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                      : 'bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border-slate-200 text-slate-600'
                  }`}
                >
                  {t.train_no} – {t.train_name}
                </button>
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>

          {/* Right: Confidence Ring */}
          {prediction && !loading && (
            <div className="flex flex-col items-center justify-center min-w-[140px] border-l border-slate-100 pl-6">
              <p className="text-xs font-semibold text-slate-500 mb-2">Model Confidence</p>
              <div className="relative flex items-center justify-center">
                <ConfidenceRing confidence={confidence} />
              </div>
              <p className="text-[10px] text-slate-400 mt-8 text-center max-w-[120px]">
                Based on 7 real-time factors
              </p>
            </div>
          )}
        </div>
      </div>

      {loading && <div className="h-40 rounded-2xl shimmer" />}

      {prediction && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
              <PredictionSummaryCard prediction={prediction} />
            </div>
            <div className="xl:col-span-2">
              <DelayTrendChart prediction={prediction} delayHistory={mockHistory} />
            </div>
          </div>

          {/* Advanced Interactive Route Map */}
          <RouteMap prediction={prediction} status={mockStatus} />

          {/* AI Intelligence Suite */}
          <AIExplanationSuite prediction={prediction} status={mockStatus} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <UpcomingStationsTable prediction={prediction} />
            <ShareCard prediction={prediction} />
          </div>
        </div>
      )}
    </div>
  );
}
