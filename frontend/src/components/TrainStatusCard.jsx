import { Train, Clock, MapPin, Zap, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';

const statusConfig = {
  Running:  { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', label: 'Running' },
  Halted:   { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-500',   label: 'Halted'   },
  Arrived:  { color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  dot: 'bg-blue-500',  label: 'Arrived'  },
  default:  { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Unknown'  },
};

export default function TrainStatusCard({ status, prediction }) {
  if (!status) return null;
  const { train_no, train_name, from_station, from_code, to_station, to_code, train_type, live } = status;
  const sc = statusConfig[live?.status] || statusConfig.default;

  const delay = live?.current_delay_minutes ?? 0;
  const delayColor = delay === 0 ? 'text-green-600' : delay <= 10 ? 'text-amber-600' : 'text-red-600';
  const delayBg   = delay === 0 ? 'bg-green-50 border-green-200' : delay <= 10 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  // Next station ETA
  const nextStation = prediction?.station_etas?.find(e => e.status === 'Delayed' || e.status === 'On Time');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Train size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{train_name}</h2>
            <p className="text-xs text-slate-500">#{train_no} · {train_type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${sc.bg} ${sc.border} ${sc.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${live?.status === 'Running' ? 'animate-pulse' : ''}`} />
          {sc.label}
        </div>
      </div>

      {/* Train Photo Showcase Banner */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900 group">
        <img
          src="/train_image.jpg"
          alt={`${train_name} Locomotive & Rake`}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/90 backdrop-blur-xs text-white border border-blue-400/30 mb-1">
              <Train size={11} /> WAP-7 Locomotive • LHB Rake
            </span>
            <p className="text-sm sm:text-base font-black drop-shadow-md text-white tracking-wide">{train_name} ({train_no})</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Traction</span>
            <span className="text-xs font-mono font-bold text-amber-300">25 kV AC Overhead</span>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-lg font-black text-blue-700">{from_code}</p>
            <p className="text-xs text-slate-600 mt-0.5">{from_station}</p>
          </div>
          <div className="flex-1 mx-4 flex items-center gap-2">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full" />
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="h-0.5 flex-1 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-indigo-700">{to_code}</p>
            <p className="text-xs text-slate-600 mt-0.5">{to_station}</p>
          </div>
        </div>
      </div>

      {/* Delay Root Cause Callout Banner */}
      {delay > 0 ? (
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50/80 via-red-50/60 to-amber-50/80 border-b border-amber-200/70 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                  Delay Reason
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {status.live?.primary_delay_reason || prediction?.primary_delay_reason?.title || (status.live?.status === 'Halted' ? 'Unscheduled Signal Hold at Outer Signal' : 'Traffic Congestion & Signal Headway Margins')}
                </span>
              </div>
              <span className="text-xs font-black font-mono text-red-700 bg-white px-2 py-0.5 rounded border border-red-200 shadow-2xs">
                +{delay}m delay
              </span>
            </div>
            {prediction?.primary_delay_reason?.description && (
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {prediction.primary_delay_reason.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-5 py-2.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">On-Time Operations:</span>
          <span className="text-emerald-700">Clear track blocks, green signals, and running at corridor permissible speed.</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
        <StatCell
          icon={<MapPin size={14} className="text-blue-500" />}
          label="Current Station"
          value={live?.current_station_name || '—'}
          sub={live?.current_station_code}
        />
        <StatCell
          icon={<AlertTriangle size={14} className={delayColor} />}
          label="Current Delay"
          value={delay === 0 ? 'On Time' : `+${delay} min`}
          valueClass={delayColor}
          badgeBg={delayBg}
        />
        <StatCell
          icon={<Clock size={14} className="text-slate-500" />}
          label="Next Station"
          value={nextStation?.station_name || '—'}
          sub={nextStation?.station_code}
        />
        <StatCell
          icon={<Zap size={14} className="text-amber-500" />}
          label="Updated ETA"
          value={nextStation?.predicted_arrival || '—'}
          sub={nextStation ? `Sched: ${nextStation.scheduled_arrival}` : ''}
        />
      </div>

      {/* Last Updated */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <Wifi size={12} className="text-green-500" />
        <p className="text-xs text-slate-500">Last updated: <span className="font-medium text-slate-700">{live?.last_updated || '—'}</span></p>
        <span className="ml-auto text-[10px] text-green-600 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Live</span>
      </div>
    </div>
  );
}

function StatCell({ icon, label, value, sub, valueClass = 'text-slate-800', badgeBg }) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-sm font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
