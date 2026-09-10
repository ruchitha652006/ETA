import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 rounded-xl px-4 py-3 shadow-2xl border border-slate-700">
      <p className="text-slate-300 text-xs font-medium mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">{p.value} min</span>
        </div>
      ))}
    </div>
  );
};

export default function DelayTrendChart({ prediction, delayHistory }) {
  if (!prediction?.station_etas) return null;

  // Build chart data
  const avgByStation = delayHistory?.avg_delay_by_station || {};
  const upcoming = prediction.station_etas.filter(e => e.status !== 'Passed');

  const chartData = upcoming.map(eta => ({
    station: eta.station_code,
    stationName: eta.station_name,
    'Predicted Delay': eta.delay_minutes,
    'Historical Avg': Math.round(avgByStation[eta.station_code] || 0),
    isPast: eta.status === 'Current',
  }));

  if (!chartData.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-md shadow-orange-500/20">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Delay Trend Analysis</h2>
            <p className="text-xs text-slate-500">AI Predicted vs Historical Average Delay</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-rose-500 rounded inline-block" />
            <span className="text-slate-600">Predicted Delay</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-400 rounded inline-block" style={{ borderStyle: 'dashed' }} />
            <span className="text-slate-600">Historical Avg</span>
          </span>
        </div>
      </div>

      <div className="p-5">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.10} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="station"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="Historical Avg"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 3"
              fill="url(#historicalGrad)"
              dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="Predicted Delay"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#predictedGrad)"
              dot={{ fill: '#ef4444', strokeWidth: 0, r: 5 }}
              activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Insight badge */}
        <div className="mt-3 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <TrendingUp size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-700">
            <strong>AI Insight:</strong> Delay is predicted to increase towards terminal stations due to accumulated congestion. 
            Confidence: <strong>{Math.round((prediction.prediction_confidence || 0) * 100)}%</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
