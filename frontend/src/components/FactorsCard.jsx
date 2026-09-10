import { Activity, MapPin, Clock, AlertTriangle, CloudRain, Gauge, Pause, BarChart2 } from 'lucide-react';

const factors = [
  { icon: MapPin,         label: 'Real-time Train Location & Speed',   desc: 'Live GPS tracking with speed telemetry', color: 'text-blue-500',   bg: 'bg-blue-50' },
  { icon: BarChart2,      label: 'Historical Delay Patterns',           desc: '30-day station-wise delay analytics',    color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Gauge,          label: 'Speed Restrictions',                  desc: 'Active track speed limit enforcement',   color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Activity,       label: 'Track Congestion',                    desc: 'Real-time congestion index per section', color: 'text-red-500',    bg: 'bg-red-50' },
  { icon: Pause,          label: 'Unscheduled Stoppages',               desc: 'Probabilistic unplanned halt model',     color: 'text-amber-500',  bg: 'bg-amber-50' },
  { icon: CloudRain,      label: 'Weather Conditions',                  desc: 'Meteorological impact on operations',   color: 'text-cyan-500',   bg: 'bg-cyan-50' },
  { icon: Clock,          label: 'Station Dwell Time',                  desc: 'Halt duration variance modelling',      color: 'text-teal-500',   bg: 'bg-teal-50' },
];

export default function FactorsCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md shadow-violet-500/20">
          <Activity size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Factors Considered</h2>
          <p className="text-xs text-slate-500">AI/ML prediction uses 7 weighted factors</p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {factors.map(({ icon: Icon, label, desc, color, bg }) => (
          <div
            key={label}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 leading-tight">{label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
