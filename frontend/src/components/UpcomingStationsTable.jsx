import { Clock, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

const statusConfig = {
  'Delayed':  { color: 'text-red-600',   bg: 'bg-red-50 border-red-200',     icon: AlertCircle,    iconColor: 'text-red-500' },
  'On Time':  { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle,    iconColor: 'text-green-500' },
  'Passed':   { color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: CheckCircle,    iconColor: 'text-slate-400' },
  'Current':  { color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200',   icon: MapPin,         iconColor: 'text-blue-500' },
  'Early':    { color: 'text-teal-600',  bg: 'bg-teal-50 border-teal-200',   icon: CheckCircle,    iconColor: 'text-teal-500' },
};

export default function UpcomingStationsTable({ prediction }) {
  if (!prediction?.station_etas) return null;
  const etas = prediction.station_etas;
  const upcoming = etas.filter(e => e.status !== 'Passed');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Upcoming Stations & Predicted ETA</h2>
            <p className="text-xs text-slate-500">{upcoming.length} stations ahead · Updated every 30s</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Visual Timeline */}
        <div className="py-4 pl-5 pr-3 border-r border-slate-100 flex flex-col items-center min-w-[64px]">
          {etas.map((eta, idx) => {
            const isLast = idx === etas.length - 1;
            const isCurrent = eta.status === 'Current';
            const isPassed = eta.status === 'Passed';
            const dotColor = isCurrent ? 'bg-blue-500 ring-4 ring-blue-100' :
                             isPassed  ? 'bg-green-400' :
                             eta.status === 'Delayed' ? 'bg-red-400' : 'bg-slate-300';
            return (
              <div key={eta.station_code} className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${dotColor}`} />
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[32px] ${isPassed ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Station</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Scheduled</th>
                <th className="text-left px-4 py-3">Predicted ETA</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Delay</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {etas.map((eta, idx) => {
                const sc = statusConfig[eta.status] || statusConfig['On Time'];
                const Icon = sc.icon;
                const delay = eta.delay_minutes;
                const isCurrent = eta.status === 'Current';
                return (
                  <tr
                    key={eta.station_code}
                    className={`border-t border-slate-100 transition-colors ${
                      isCurrent ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-medium">{eta.stop_number}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />}
                        <div>
                          <p className={`font-semibold ${isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>
                            {eta.station_name}
                          </p>
                          <p className="text-[10px] text-slate-400">{eta.station_code} · {eta.distance_from_origin} km</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-xs text-slate-500">
                      {eta.scheduled_arrival === 'Starts' || eta.scheduled_arrival === 'Ends'
                        ? <span className="text-slate-400 italic">{eta.scheduled_arrival}</span>
                        : eta.scheduled_arrival
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-bold ${
                        eta.status === 'Delayed' ? 'text-red-700' :
                        eta.status === 'Current' ? 'text-blue-700' :
                        eta.status === 'Passed' ? 'text-slate-400' : 'text-green-700'
                      }`}>
                        {eta.predicted_arrival === 'Starts' || eta.predicted_arrival === 'Ends'
                          ? <span className="text-slate-400 italic text-xs">{eta.predicted_arrival}</span>
                          : eta.predicted_arrival
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {eta.status === 'Passed' ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <span className={`text-xs font-semibold ${
                          delay === 0 ? 'text-green-600' :
                          delay > 0 ? 'text-red-600' : 'text-teal-600'
                        }`}>
                          {delay === 0 ? '0 min' : delay > 0 ? `+${delay} min` : `${delay} min`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                        <Icon size={10} className={sc.iconColor} />
                        {eta.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
