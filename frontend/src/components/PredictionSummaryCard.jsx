import { Brain, TrendingUp, Gauge, Target, Activity } from 'lucide-react';

export default function PredictionSummaryCard({ prediction }) {
  if (!prediction) return null;

  const { total_expected_delay, prediction_confidence, current_speed, factors_applied } = prediction;
  const confidence = Math.round((prediction_confidence || 0) * 100);
  const confColor = confidence >= 85 ? '#22c55e' : confidence >= 70 ? '#f59e0b' : '#ef4444';

  const delayColor =
    total_expected_delay === 0 ? 'text-green-600' :
    total_expected_delay <= 15 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Prediction Summary</h2>
            <p className="text-xs text-purple-600 font-medium">AI/ML Based Prediction</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          7 Factors
        </div>
      </div>

      <div className="p-5">
        {/* Main metrics */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Total Delay */}
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
            <TrendingUp size={18} className={`${delayColor} mx-auto mb-2`} />
            <p className={`text-2xl font-black ${delayColor}`}>
              {total_expected_delay === 0 ? '0' : `+${total_expected_delay}`}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Total Delay (min)</p>
          </div>

          {/* Confidence */}
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="relative w-12 h-12 mx-auto mb-2">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="18" fill="none"
                  stroke={confColor} strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - confidence / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{confidence}%</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Confidence</p>
          </div>

          {/* Speed */}
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Gauge size={18} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-blue-600">{Math.round(current_speed || 0)}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Speed (km/h)</p>
          </div>
        </div>

        {/* Factors */}
        {factors_applied && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Applied Factors</p>
            <div className="space-y-2">
              {[
                { key: 'current_delay_minutes', label: 'Current Delay', suffix: ' min', color: 'bg-red-400' },
                { key: 'track_congestion', label: 'Track Congestion', suffix: '', color: 'bg-amber-400' },
                { key: 'weather_severity', label: 'Weather Impact', suffix: '', color: 'bg-blue-400' },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${f.color} flex-shrink-0`} />
                  <span className="text-xs text-slate-600 flex-1">{f.label}</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {factors_applied[f.key]}{f.suffix}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${factors_applied.speed_restriction_active ? 'bg-red-500' : 'bg-green-400'} flex-shrink-0`} />
                <span className="text-xs text-slate-600 flex-1">Speed Restriction</span>
                <span className={`text-xs font-semibold ${factors_applied.speed_restriction_active ? 'text-red-600' : 'text-green-600'}`}>
                  {factors_applied.speed_restriction_active ? 'Active' : 'None'}
                </span>
              </div>
              {prediction.primary_delay_reason && (
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Primary Delay Root Cause</span>
                      <span className="font-bold text-slate-800 text-xs block leading-snug">
                        {prediction.primary_delay_reason.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {prediction.primary_delay_reason.official_code && (
                          <span className="text-[10px] text-blue-600 font-mono font-semibold">
                            {prediction.primary_delay_reason.official_code}
                          </span>
                        )}
                        <span className="text-[10px] text-red-600 font-bold">
                          +{prediction.primary_delay_reason.impact_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
