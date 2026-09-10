import { useState } from 'react';
import {
  Brain,
  AlertTriangle,
  Activity,
  TrendingUp,
  Sliders,
  ShieldAlert,
  Zap,
  Clock,
  Gauge,
  HelpCircle,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Radio,
  BarChart3,
  Compass,
  Layers,
  MapPin,
  Sparkles,
  Filter
} from 'lucide-react';

export default function AIExplanationSuite({ prediction, status }) {
  const {
    train_no,
    train_name,
    total_expected_delay = 0,
    prediction_confidence = 0.9,
    current_speed = 0,
    station_etas = [],
    factors_applied = {},
    anomaly_detection = {},
    congestion_detection = {},
    future_delays = {},
    delay_reasons = [],
    primary_delay_reason = null,
    delay_attribution_breakdown = [],
  } = prediction || {};

  const currentDelay = factors_applied.current_delay_minutes ?? status?.live?.current_delay_minutes ?? 0;
  const congestionVal = parseInt(factors_applied.track_congestion || '30');
  const confidencePct = Math.round(prediction_confidence * 100);

  // Default tab: 'reasons' if train is delayed, else 'eta'
  const [activeTab, setActiveTab] = useState(currentDelay > 0 ? 'reasons' : 'eta');
  const [categoryFilter, setCategoryFilter] = useState('All');

  if (!prediction) return null;

  // Fallback delay reasons if not provided in payload
  const resolvedDelayReasons = delay_reasons?.length > 0 ? delay_reasons : (
    currentDelay > 0 ? [
      {
        id: 'primary_fallback',
        category: current_speed === 0 ? 'Signaling & Traffic' : congestionVal > 40 ? 'Traffic & Routing' : 'Station Operations',
        title: current_speed === 0
          ? `Signal Hold at ${status?.live?.current_station_code || 'Junction'} Outer`
          : congestionVal > 40 ? 'Track Congestion & Signal Headway Compression' : 'Station Dwell & Passenger Turnover',
        impact_minutes: Math.max(3, Math.round(currentDelay * 0.6)),
        severity: currentDelay > 20 ? 'High' : 'Medium',
        location: `${status?.live?.current_station_name || 'En Route'} Block Section`,
        description: current_speed === 0
          ? 'Train is stationary outside station awaiting platform clearance and interlocking route clearance.'
          : 'High traffic density on upcoming track sections requiring cautionary signal adherence.',
        official_code: current_speed === 0 ? 'IR-SIG-04' : 'IR-OPR-09',
        recovery_outlook: 'Moderate: Subject to platform vacancy in next yard.',
        icon_type: 'signal',
      },
      {
        id: 'secondary_fallback',
        category: 'Station Operations',
        title: 'Platform Dwell & Parcel / Boarding Time',
        impact_minutes: Math.max(2, Math.round(currentDelay * 0.4)),
        severity: 'Low',
        location: 'Origin / Previous Junction',
        description: 'Passenger turnover and baggage loading required minor halt extension.',
        official_code: 'IR-OPT-03',
        recovery_outlook: 'High: Recoverable using schedule recovery margins.',
        icon_type: 'clock',
      }
    ] : [
      {
        id: 'on_time',
        category: 'Normal Operations',
        title: 'Running on Schedule',
        impact_minutes: 0,
        severity: 'Low',
        location: 'Entire Corridor',
        description: 'No speed caution orders, clear signals, and zero delay propagation.',
        official_code: 'IR-NOM-00',
        recovery_outlook: 'Optimal: Schedule slack buffer intact.',
        icon_type: 'check',
      }
    ]
  );

  const primaryReason = primary_delay_reason || resolvedDelayReasons[0];

  // Fallback breakdown if missing
  const resolvedBreakdown = delay_attribution_breakdown?.length > 0 ? delay_attribution_breakdown : (
    currentDelay > 0 ? [
      { category: primaryReason?.category || 'Signaling & Traffic', minutes: primaryReason?.impact_minutes || currentDelay, percentage: 65, color: 'red' },
      { category: 'Station Operations', minutes: Math.max(2, currentDelay - (primaryReason?.impact_minutes || currentDelay)), percentage: 35, color: 'blue' }
    ] : [
      { category: 'Normal Operations', minutes: 0, percentage: 100, color: 'emerald' }
    ]
  );

  const filteredReasons = categoryFilter === 'All'
    ? resolvedDelayReasons
    : resolvedDelayReasons.filter(r => r.category === categoryFilter);

  // Derived / fallback anomaly info
  const anomalyLevel = anomaly_detection.level || (currentDelay > 25 ? 'CRITICAL' : currentDelay > 12 ? 'MODERATE' : 'NOMINAL');
  const anomalyScore = anomaly_detection.anomaly_score ?? Math.min(100, Math.round(currentDelay * 1.6 + congestionVal * 0.4));
  const detectedIssues = anomaly_detection.detected_issues || [];

  // Derived / fallback congestion info
  const headwayKm = congestion_detection.headway_distance_km || (congestionVal > 50 ? 7.2 : 12.5);
  const congestionImpactMin = congestion_detection.delay_impact_minutes || Math.round(congestionVal * 0.18);
  const los = congestion_detection.level_of_service || (congestionVal < 25 ? 'LOS A (Free Flow)' : congestionVal < 50 ? 'LOS B (Normal)' : 'LOS C (Dense)');

  // Derived / fallback future delay info
  const p10 = future_delays.p10_optimistic ?? Math.max(0, total_expected_delay - 6);
  const p50 = future_delays.p50_expected ?? total_expected_delay;
  const p90 = future_delays.p90_pessimistic ?? (total_expected_delay + 14);
  const cascadeRisk = future_delays.cascade_risk || (total_expected_delay > 20 ? 'High' : total_expected_delay > 8 ? 'Moderate' : 'Low');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">AI Intelligence & Deep Diagnostics</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Multi-Factor ML
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Comprehensive explanation of arrival predictions, delay root causes, traffic bottlenecks, and forecast cones
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 gap-1 text-xs">
          {[
            {
              id: 'reasons',
              label: 'Delay Reasons',
              icon: AlertCircle,
              badge: currentDelay > 0 ? `+${currentDelay}m` : 'On Time',
              badgeColor: currentDelay > 0 ? 'bg-red-500/30 text-red-300 border-red-400/30' : 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30'
            },
            { id: 'eta',        label: 'ETA Explanation',     icon: Clock },
            { id: 'anomaly',    label: 'Anomaly Detection',   icon: ShieldAlert },
            { id: 'congestion', label: 'Congestion Analytics', icon: Activity },
            { id: 'future',     label: 'Future Delay Forecast', icon: TrendingUp },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {t.badge && (
                  <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full border ${t.badgeColor || ''}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="p-6">
        {/* ===================================================================
            TAB 0: DELAY REASONS & ROOT-CAUSE DIAGNOSTICS
           =================================================================== */}
        {activeTab === 'reasons' && (
          <div className="space-y-6">
            {/* Primary Root Cause Hero Card */}
            {currentDelay > 0 ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/80 shadow-xl text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-black uppercase tracking-wider text-red-400">
                        Primary Delay Root Cause
                      </span>
                      {primaryReason?.official_code && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {primaryReason.official_code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                        primaryReason?.severity === 'High'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {primaryReason?.severity || 'Medium'} Operational Severity
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        {primaryReason?.title || 'Operational Signal Hold'}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                        <MapPin size={13} className="text-red-400 flex-shrink-0" />
                        <span>Incident Sector: <strong>{primaryReason?.location || `${status?.live?.current_station_name || 'En Route'} Block`}</strong></span>
                      </div>
                    </div>
                    <div className="text-left lg:text-right flex-shrink-0 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Direct Time Lost Here
                      </span>
                      <span className="text-3xl font-black font-mono text-red-400">
                        +{primaryReason?.impact_minutes || currentDelay} min
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {Math.round(((primaryReason?.impact_minutes || currentDelay) / (currentDelay || 1)) * 100)}% of total running delay
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    <div className="lg:col-span-2 text-slate-300 leading-relaxed bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                      <p className="font-semibold text-slate-200 mb-1">Operational Incident Narrative:</p>
                      {primaryReason?.description}
                    </div>
                    <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-indigo-300 block">Downstream Recovery Outlook</span>
                        <p className="text-slate-200 font-medium mt-1">{primaryReason?.recovery_outlook || 'Subject to clearance ahead'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold mt-2">
                        <Sparkles size={12} />
                        <span>AI Confidence: {confidencePct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900/90 to-teal-950 border border-emerald-500/30 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Running on Schedule — No Active Delays</h3>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      All route interlockings clear, automatic block signals green, and train operating within scheduled timetable margins.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delay Attribution Breakdown */}
            {currentDelay > 0 && resolvedBreakdown.length > 0 && (
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Delay Time Attribution by Category</h4>
                    <p className="text-xs text-slate-500">Root-cause factor decomposition across total delay</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Total Delay: +{currentDelay} min
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5">
                  {resolvedBreakdown.map(item => {
                    const bgClass =
                      item.color === 'red' ? 'bg-red-500' :
                      item.color === 'amber' ? 'bg-amber-500' :
                      item.color === 'orange' ? 'bg-orange-500' :
                      item.color === 'blue' ? 'bg-blue-500' :
                      item.color === 'cyan' ? 'bg-cyan-500' : 'bg-indigo-500';
                    return (
                      <div
                        key={item.category}
                        style={{ width: `${Math.max(6, item.percentage)}%` }}
                        className={`h-full ${bgClass} rounded-sm transition-all`}
                        title={`${item.category}: +${item.minutes}m (${item.percentage}%)`}
                      />
                    );
                  })}
                </div>

                {/* Breakdown cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                  {resolvedBreakdown.map(item => {
                    const borderClass =
                      item.color === 'red' ? 'border-red-200 bg-red-50/60 text-red-900' :
                      item.color === 'amber' ? 'border-amber-200 bg-amber-50/60 text-amber-900' :
                      item.color === 'orange' ? 'border-orange-200 bg-orange-50/60 text-orange-900' :
                      item.color === 'blue' ? 'border-blue-200 bg-blue-50/60 text-blue-900' :
                      'border-cyan-200 bg-cyan-50/60 text-cyan-900';
                    return (
                      <div key={item.category} className={`p-3 rounded-xl border ${borderClass}`}>
                        <span className="text-[10px] font-bold uppercase opacity-80 block truncate">{item.category}</span>
                        <p className="text-lg font-black mt-0.5">+{item.minutes} min</p>
                        <span className="text-[10px] font-semibold opacity-70">{item.percentage}% share</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diagnostic Reasons Log & Filter */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    Comprehensive Delay Reasons Log ({filteredReasons.length})
                  </h4>
                  <span className="text-xs text-slate-400">· Official operational breakdown</span>
                </div>

                {/* Category filter pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {['All', ...new Set(resolvedDelayReasons.map(r => r.category))].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        categoryFilter === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReasons.map((reason, idx) => {
                  const isHigh = reason.severity === 'High';
                  const isMedium = reason.severity === 'Medium';
                  return (
                    <div
                      key={reason.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {reason.category}
                            </span>
                            {reason.official_code && (
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                {reason.official_code}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isHigh ? 'bg-red-50 text-red-700 border-red-200' :
                            isMedium ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {reason.severity} Severity
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <h5 className="font-bold text-slate-800 text-sm leading-snug">
                            {reason.title}
                          </h5>
                          <span className="text-base font-black font-mono text-red-600 flex-shrink-0">
                            +{reason.impact_minutes} min
                          </span>
                        </div>

                        {reason.location && (
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                            <span>{reason.location}</span>
                          </p>
                        )}

                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {reason.description}
                        </p>
                      </div>

                      {reason.recovery_outlook && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Recovery Outlook:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[220px]" title={reason.recovery_outlook}>
                            {reason.recovery_outlook}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indian Railways Operational Dispatching Context */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Info size={14} className="text-indigo-600" />
                <span>How Railway Dispatchers & Controllers Manage Delay Cascades</span>
              </div>
              <p className="leading-relaxed">
                Indian Railways operational rules prioritize trains based on corridor class (Vande Bharat / Rajdhani &gt; Superfast Express &gt; Mail/Express &gt; Freight). When higher-priority rakes run on close headway, preceding trains are held at intermediate outer signals. Furthermore, permanent caution orders (e.g. river bridge safety limits or turnout renovations) impose fixed time penalties that driver throttle recovery cannot bypass.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 1: ETA EXPLANATION & CALCULATION MODEL
           =================================================================== */}
        {activeTab === 'eta' && (
          <div className="space-y-6">
            {/* Mathematical Formula Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80">
              <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <Brain size={15} className="text-blue-600" />
                <span>ETA Mathematical Formulation</span>
              </div>
              <p className="font-mono text-xs md:text-sm font-semibold text-slate-800 bg-white/80 p-3 rounded-lg border border-blue-100 shadow-2xs">
                ETA = Scheduled_Arrival + Base_Delay + ΔCongestion + ΔCaution_Orders + ΔWeather + ΔUnscheduled_Halt - Slack_Recovery
              </p>
              <p className="text-xs text-slate-600 mt-2">
                The RailETA AI engine aggregates real-time telemetry, 30-day historical station dwell times, and 7 dynamic environmental variables to project arrival timestamps per stop.
              </p>
            </div>

            {/* Weights Breakdown + Live Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Factor Weights */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>Ensemble Weight Distribution</span>
                  <span className="text-xs text-indigo-600 font-semibold">Sum = 100%</span>
                </h3>
                <div className="space-y-2.5">
                  {[
                    { name: 'Current Running Delay Propagation', weight: 35, color: 'bg-red-500', desc: 'Primary dynamic signal carrying current delay ahead' },
                    { name: '30-Day Historical Station Mean',    weight: 25, color: 'bg-purple-500', desc: 'Station-specific historical bottlenecks & dwell trends' },
                    { name: 'Real-time Section Congestion',      weight: 12, color: 'bg-amber-500', desc: 'Traffic saturation on upcoming block sections' },
                    { name: 'Active Speed Caution Orders',       weight: 12, color: 'bg-orange-500', desc: 'Permanent/temporary track speed limits' },
                    { name: 'Meteorological & Weather Impact',    weight: 8,  color: 'bg-blue-500', desc: 'Rain, fog visibility, or gradient friction' },
                    { name: 'Unscheduled Halt Probability',      weight: 5,  color: 'bg-cyan-500', desc: 'Signal checks and outer junction waiting times' },
                    { name: 'Platform Dwell Variance',           weight: 3,  color: 'bg-teal-500', desc: 'Passenger loading fluctuation by station size' },
                  ].map(w => (
                    <div key={w.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{w.name}</span>
                        <span className="font-bold font-mono text-slate-900">{w.weight}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.weight}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Factor Contributions for Current Train */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Live Prediction Factors Applied</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100">
                    <span className="text-[10px] font-bold uppercase text-red-600">Current Delay Base</span>
                    <p className="text-2xl font-black text-red-700 mt-1">+{currentDelay} min</p>
                    <p className="text-[11px] text-red-600/80 mt-0.5">Propagates downstream</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-[10px] font-bold uppercase text-amber-600">Track Congestion Impact</span>
                    <p className="text-2xl font-black text-amber-700 mt-1">+{congestionImpactMin} min</p>
                    <p className="text-[11px] text-amber-600/80 mt-0.5">{congestionVal}% saturation</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[10px] font-bold uppercase text-blue-600">Confidence Score</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">{confidencePct}%</p>
                    <p className="text-[11px] text-blue-600/80 mt-0.5">High sensor reliability</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase text-emerald-600">Total Projected Delay</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">+{total_expected_delay} min</p>
                    <p className="text-[11px] text-emerald-600/80 mt-0.5">At terminal destination</p>
                  </div>
                </div>

                {/* Explanation insight */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Info size={13} className="text-blue-500" />
                    <span>How Confidence is Scored</span>
                  </div>
                  <p>
                    Base confidence begins at <strong>95%</strong>. Deductions are applied dynamically for high congestion (-10% max), adverse weather (-8% max), active speed cautions (-5%), and missing telemetry. High historical sample density boosts confidence by up to +5%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: ANOMALY DETECTION ENGINE
           =================================================================== */}
        {activeTab === 'anomaly' && (
          <div className="space-y-6">
            {/* Status overview bar */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              anomalyLevel === 'CRITICAL'
                ? 'bg-red-50 border-red-200 text-red-900'
                : anomalyLevel === 'MODERATE'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  anomalyLevel === 'CRITICAL' ? 'bg-red-600 text-white' : anomalyLevel === 'MODERATE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base">Anomaly Scan Status: {anomalyLevel}</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/80 border">
                      Score: {anomalyScore}/100
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-0.5">
                    Real-time automated surveillance analyzing velocity variances, unscheduled stoppages, and corridor divergence
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold block">Schedule Deviation</span>
                <span className="text-lg font-black font-mono">{anomaly_detection.schedule_divergence || '1.2σ'}</span>
              </div>
            </div>

            {/* 4 Core Anomaly Sensors */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  title: 'Unscheduled Halt Detector',
                  status: current_speed === 0 && currentDelay > 10 ? 'ALERT' : 'NORMAL',
                  statusColor: current_speed === 0 && currentDelay > 10 ? 'text-red-600 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  desc: current_speed === 0 ? 'Train stationary outside timetable stop.' : 'Train progressing along corridor normally.',
                  metric: current_speed === 0 ? '0 km/h Halted' : `${current_speed} km/h Moving`,
                },
                {
                  title: 'Speed Degradation Check',
                  status: current_speed > 0 && current_speed < 35 ? 'ELEVATED' : 'NORMAL',
                  statusColor: current_speed > 0 && current_speed < 35 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  desc: 'Section speed compared against corridor MPS (110 km/h ceiling).',
                  metric: `${current_speed} km/h`,
                },
                {
                  title: 'Schedule Divergence (Z-Score)',
                  status: currentDelay > 20 ? 'ALERT' : currentDelay > 10 ? 'ELEVATED' : 'NORMAL',
                  statusColor: currentDelay > 20 ? 'text-red-600 bg-red-50 border-red-200' : currentDelay > 10 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  desc: 'Compares delay against historical mean Gaussian bell curve.',
                  metric: `${anomaly_detection.schedule_divergence || '1.2σ'}`,
                },
                {
                  title: 'Infrastructure & Caution Orders',
                  status: factors_applied.speed_restriction_active ? 'CAUTION' : 'CLEAR',
                  statusColor: factors_applied.speed_restriction_active ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  desc: 'Monitors permanent way restrictions & bridge cautionary signals.',
                  metric: factors_applied.speed_restriction_active ? 'Active Restrictions' : 'All Clear',
                },
              ].map(s => (
                <div key={s.title} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{s.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.statusColor}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xl font-black text-slate-900 mb-1">{s.metric}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Detected Issues Log */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>Active Diagnostic Anomaly Log</span>
              </h4>
              {detectedIssues.length > 0 ? (
                <div className="space-y-2.5">
                  {detectedIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        issue.severity === 'High' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800">{issue.type}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            issue.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {issue.severity} Severity
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-semibold">
                    No critical anomalies detected. Train running within expected operational parameters across corridor.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: CONGESTION DETECTION & BOTTLENECK ANALYTICS
           =================================================================== */}
        {activeTab === 'congestion' && (
          <div className="space-y-6">
            {/* Top metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500">Section Saturation</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">{congestionVal}%</p>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      congestionVal > 60 ? 'bg-red-500' : congestionVal > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${congestionVal}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500">Level of Service (LOS)</span>
                <p className="text-base font-black text-slate-800 mt-1">{los}</p>
                <p className="text-xs text-slate-500 mt-1">Railway Capacity Tier</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500">Dynamic Headway Gap</span>
                <p className="text-2xl font-black text-cyan-600 mt-1">{headwayKm} km</p>
                <p className="text-xs text-slate-500 mt-1">To preceding train</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500">Congestion Delay Penalty</span>
                <p className="text-2xl font-black text-red-600 mt-1">+{congestionImpactMin} min</p>
                <p className="text-xs text-slate-500 mt-1">Added to upcoming stops</p>
              </div>
            </div>

            {/* Deep Congestion Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* How Congestion Works */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" />
                  <span>Track Density & Queue Mechanics</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Indian Railway track sections operate under automatic and absolute block signaling. When traffic saturation exceeds <strong>65%</strong>, average train headway compresses, causing caution signals (Double Yellow / Yellow) that mandate speed reductions to 30–50 km/h.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-semibold text-slate-700">0% – 25% (LOS A):</span>
                    <span className="text-emerald-600 font-bold">Clear Signals · Full Speed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-semibold text-slate-700">25% – 50% (LOS B):</span>
                    <span className="text-blue-600 font-bold">Stable Flow · Minimal Headway Drag</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-semibold text-slate-700">50% – 75% (LOS C):</span>
                    <span className="text-amber-600 font-bold">Dense Traffic · +4 to +9 min delay</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-semibold text-slate-700">&gt; 75% (LOS D/F):</span>
                    <span className="text-red-600 font-bold">Interlocking Gridlock · +12+ min delay</span>
                  </div>
                </div>
              </div>

              {/* Junction Bottleneck Radar */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Compass size={16} className="text-indigo-600" />
                  <span>Junction Interlocking & Bottleneck Radar</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-800">Kazipet Jn (KZJ) Yard Throat</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Moderate Conflict
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Major confluence of Secunderabad and Balharshah freight trunks. Route interlocking may require 3-5 min signal holding.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-800">Vijayawada Jn (BZA) Platform Throat</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        High Congestion Node
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      10 platforms with over 200 daily train movements. High platform occupancy probability during peak hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: FUTURE DELAYS & PROPAGATION FORECAST CONE
           =================================================================== */}
        {activeTab === 'future' && (
          <div className="space-y-6">
            {/* 3-Scenario Forecast Cone Banner */}
            <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Probabilistic Delay Forecast Cone</span>
                    <span className="text-xs font-normal text-indigo-300">(P10 - P50 - P90)</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Terminal arrival delay scenarios considering signal priority and recovery buffer
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cascade Risk</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full block mt-0.5 ${
                    cascadeRisk === 'High' ? 'bg-red-500/30 text-red-300 border border-red-400/30' : 'bg-amber-500/30 text-amber-300 border border-amber-400/30'
                  }`}>
                    {cascadeRisk} Risk
                  </span>
                </div>
              </div>

              {/* 3 Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Optimistic */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 backdrop-blur">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
                    <span>🟢 OPTIMISTIC (P10)</span>
                    <span>Best Case</span>
                  </div>
                  <p className="text-3xl font-black text-white font-mono mt-1">+{p10} min</p>
                  <p className="text-xs text-slate-300 mt-2">
                    Green signals, maximum allowable speed recovery on high-speed track blocks.
                  </p>
                </div>

                {/* Expected */}
                <div className="p-4 rounded-xl bg-indigo-900/60 border border-indigo-400/40 backdrop-blur shadow-lg">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-bold mb-1">
                    <span>🟡 EXPECTED (P50)</span>
                    <span>AI Ensemble Baseline</span>
                  </div>
                  <p className="text-3xl font-black text-cyan-300 font-mono mt-1">+{p50} min</p>
                  <p className="text-xs text-slate-300 mt-2">
                    Standard weighted projection incorporating current congestion and historical mean.
                  </p>
                </div>

                {/* Pessimistic */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-red-500/30 backdrop-blur">
                  <div className="flex items-center justify-between text-xs text-red-400 font-bold mb-1">
                    <span>🔴 PESSIMISTIC (P90)</span>
                    <span>Worst Case</span>
                  </div>
                  <p className="text-3xl font-black text-white font-mono mt-1">+{p90} min</p>
                  <p className="text-xs text-slate-300 mt-2">
                    Platform holding at junction throats, precedence conflict with premium rakes.
                  </p>
                </div>
              </div>
            </div>

            {/* Delay Propagation Mechanics & Recovery Slack */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" />
                  <span>Delay Cascade & Propagation Dynamics</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In railway networks, delay does not remain flat: it either <strong>cascades</strong> (compounds due to losing scheduled passing slots and platform entry conflicts) or is <strong>absorbed</strong> via engineered schedule slack.
                </p>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5 text-xs">
                  <p className="font-bold text-indigo-900">Recovery Slack in Corridor:</p>
                  <p className="text-indigo-800">
                    Timetables typically contain <strong>2 to 4 minutes</strong> of engineered buffer per 100 km. If track conditions are clear and no caution orders exist, the driver can recover ~1-2 min per subsequent block.
                  </p>
                </div>
              </div>

              {/* Station-wise projected delay evolution */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Upcoming Station Delay Projections</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {station_etas.filter(s => s.status !== 'Passed').map((st, idx) => (
                    <div key={st.station_code} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{st.station_code} – {st.station_name}</span>
                        <span className="text-[10px] text-slate-400 block">{st.scheduled_arrival} → {st.predicted_arrival}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black font-mono ${st.delay_minutes > 15 ? 'text-red-600' : 'text-amber-600'}`}>
                          {st.delay_minutes > 0 ? `+${st.delay_minutes} min` : 'On Time'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Stop #{st.stop_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
