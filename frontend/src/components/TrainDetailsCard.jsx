import { Train, MapPin, Gauge, Clock, Navigation, Wifi, RefreshCw } from 'lucide-react';

export default function TrainDetailsCard({ status, prediction }) {
  if (!status) return null;
  const { train_no, train_name, from_station, from_code, to_station, to_code, train_type, live } = status;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
          <Train size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Train Details</h2>
          <p className="text-xs text-slate-500">Full operational information</p>
        </div>
      </div>

      {/* Train Visual Banner */}
      <div className="px-5 pt-4">
        <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200">
          <img
            src="/train_image.jpg"
            alt={train_name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span className="font-bold flex items-center gap-1.5"><Train size={13} className="text-blue-400" /> WAP-7 3-Phase Electric Loco</span>
            <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-600">22 Coaches (LHB)</span>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 gap-3">
        {[
          { icon: Train,      label: 'Train No',        value: train_no,                        color: 'text-blue-600' },
          { icon: Train,      label: 'Train Name',      value: train_name,                      color: 'text-slate-800' },
          { icon: MapPin,     label: 'From',            value: `${from_station} (${from_code})`, color: 'text-green-700' },
          { icon: Navigation, label: 'To',              value: `${to_station} (${to_code})`,    color: 'text-red-700' },
          { icon: Gauge,      label: 'Current Speed',   value: `${Math.round(live?.current_speed_kmh || 0)} km/h`, color: 'text-indigo-600' },
          { icon: MapPin,     label: 'Dist. to Next',   value: `${live?.distance_to_next_station || '—'} km`,      color: 'text-slate-700' },
          { icon: Clock,      label: 'Last Updated',    value: `${live?.last_updated || '—'} (Live)`,              color: 'text-green-600' },
          { icon: Train,      label: 'Train Type',      value: train_type || 'Express',                            color: 'text-purple-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} className="text-slate-400" />
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-sm font-bold ${color} leading-tight`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Live update notice */}
      <div className="mx-5 mb-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Wifi size={14} className="text-green-600" />
          <RefreshCw size={12} className="text-green-500 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <p className="text-xs text-green-700">
          <strong>Live Update:</strong> The prediction is updated continuously as new data arrives. Auto-refresh every 30 seconds.
        </p>
      </div>
    </div>
  );
}
