import { useState } from 'react';
import { BarChart2, Train, Clock, TrendingUp, Star, ChevronDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { MOCK_DELAY_HISTORY, MOCK_STATUS } from '../data/mockData';

const TRAIN_OPTIONS = [
  { no: '12723', name: 'Telangana Express', from: 'HYB', to: 'NLR' },
  { no: '12759', name: 'Charminar Express', from: 'HYB', to: 'MAS' },
  { no: '17201', name: 'Golconda Express',  from: 'SC',  to: 'MAS' },
];

const TRAIN_STATS = {
  '12723': {
    avgDelay: '18.4 min', onTimeRate: 38, worstDelay: '52 min', runs: 6,
    recentRuns: [
      { date: 'Sep 9', delay: 22, status: 'Delayed' },
      { date: 'Sep 8', delay: 15, status: 'Delayed' },
      { date: 'Sep 7', delay: 0,  status: 'On Time' },
      { date: 'Sep 6', delay: 31, status: 'Delayed' },
      { date: 'Sep 5', delay: 8,  status: 'Delayed' },
      { date: 'Sep 4', delay: 0,  status: 'On Time' },
    ],
    donut: [
      { name: 'On Time', value: 38, color: '#22c55e' },
      { name: 'Minor (<15m)', value: 24, color: '#f59e0b' },
      { name: 'Moderate (15–30m)', value: 22, color: '#f97316' },
      { name: 'Major (>30m)', value: 16, color: '#ef4444' },
    ],
  },
  '12759': {
    avgDelay: '12.1 min', onTimeRate: 55, worstDelay: '38 min', runs: 6,
    recentRuns: [
      { date: 'Sep 9', delay: 8,  status: 'Delayed' },
      { date: 'Sep 8', delay: 0,  status: 'On Time' },
      { date: 'Sep 7', delay: 12, status: 'Delayed' },
      { date: 'Sep 6', delay: 0,  status: 'On Time' },
      { date: 'Sep 5', delay: 38, status: 'Delayed' },
      { date: 'Sep 4', delay: 0,  status: 'On Time' },
    ],
    donut: [
      { name: 'On Time', value: 55, color: '#22c55e' },
      { name: 'Minor (<15m)', value: 20, color: '#f59e0b' },
      { name: 'Moderate (15–30m)', value: 15, color: '#f97316' },
      { name: 'Major (>30m)', value: 10, color: '#ef4444' },
    ],
  },
  '17201': {
    avgDelay: '24.7 min', onTimeRate: 22, worstDelay: '67 min', runs: 6,
    recentRuns: [
      { date: 'Sep 9', delay: 45, status: 'Delayed' },
      { date: 'Sep 8', delay: 28, status: 'Delayed' },
      { date: 'Sep 7', delay: 0,  status: 'On Time' },
      { date: 'Sep 6', delay: 67, status: 'Delayed' },
      { date: 'Sep 5', delay: 19, status: 'Delayed' },
      { date: 'Sep 4', delay: 10, status: 'Delayed' },
    ],
    donut: [
      { name: 'On Time', value: 22, color: '#22c55e' },
      { name: 'Minor (<15m)', value: 18, color: '#f59e0b' },
      { name: 'Moderate (15–30m)', value: 28, color: '#f97316' },
      { name: 'Major (>30m)', value: 32, color: '#ef4444' },
    ],
  },
};

function PerformanceScore({ onTimeRate }) {
  const score = Math.round(onTimeRate);
  const color = score >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 45 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';
  const stars = score >= 70 ? 5 : score >= 50 ? 4 : score >= 35 ? 3 : score >= 20 ? 2 : 1;
  return (
    <div className={`p-5 rounded-2xl border ${color} flex flex-col items-center gap-1`}>
      <p className="text-4xl font-black">{score}</p>
      <p className="text-xs font-semibold uppercase tracking-wide">Performance Score</p>
      <div className="flex gap-0.5 mt-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={12} className={i <= stars ? 'fill-current' : 'opacity-30'} />
        ))}
      </div>
    </div>
  );
}

export default function History() {
  const [selectedTrain, setSelectedTrain] = useState('12723');
  const [dropOpen, setDropOpen] = useState(false);

  const train = TRAIN_OPTIONS.find(t => t.no === selectedTrain);
  const stats = TRAIN_STATS[selectedTrain];
  const histData = Object.entries(MOCK_DELAY_HISTORY[selectedTrain]?.avg_delay_by_station || {})
    .map(([k, v]) => ({ station: k, avgDelay: v }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header + Train Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">History & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Historical delay trends · {train?.name} ({selectedTrain})
          </p>
        </div>

        {/* Train selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropOpen(d => !d)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 transition-all shadow-sm"
          >
            <Train size={14} className="text-blue-600" />
            {selectedTrain} – {train?.name}
            <ChevronDown size={14} className={`transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[240px]">
              {TRAIN_OPTIONS.map(t => (
                <button
                  key={t.no}
                  onClick={() => { setSelectedTrain(t.no); setDropOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedTrain === t.no
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-mono">{t.no}</span> – {t.name}
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.from} → {t.to}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row + Performance Score */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Avg Delay (30d)', value: stats.avgDelay, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Worst Delay',    value: stats.worstDelay, icon: BarChart2, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Trains Tracked', value: '5',             icon: Train, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Runs Analyzed',  value: stats.runs,       icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`p-5 rounded-2xl border ${s.bg} ${s.border}`}>
            <s.icon size={18} className={`${s.color} mb-2`} />
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
        <PerformanceScore onTimeRate={stats.onTimeRate} />
      </div>

      {/* Chart + Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-4">Average Delay by Station</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={histData}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="station" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}m`} />
              <Tooltip formatter={v => [`${v} min`, 'Avg Delay']} />
              <Area type="monotone" dataKey="avgDelay" stroke="#3b82f6" fill="url(#histGrad)" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Delay severity donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-4">Delay Severity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.donut}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {stats.donut.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={v => [`${v}%`, '']} />
              <Legend
                iconType="circle" iconSize={8}
                formatter={v => <span className="text-[10px] text-slate-600">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent runs table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Runs – {selectedTrain} {train?.name}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wide">
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Total Delay</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Severity</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentRuns.map(r => (
              <tr key={r.date} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-700">{r.date}, 2026</td>
                <td className={`px-5 py-3 font-bold ${r.delay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {r.delay > 0 ? `+${r.delay} min` : '0 min'}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    r.status === 'On Time'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>{r.status}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        r.delay === 0 ? 'bg-green-500' : r.delay < 15 ? 'bg-amber-400' : r.delay < 30 ? 'bg-orange-500' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min((r.delay / 60) * 100, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
