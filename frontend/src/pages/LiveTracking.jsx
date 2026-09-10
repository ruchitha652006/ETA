import { useState, useEffect, useRef } from 'react';
import { Radio, RefreshCw, Train, Activity, Gauge, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { getTrainStatus, getETAPrediction } from '../services/api';
import { getMockStatus, getMockPrediction, MOCK_TRAINS } from '../data/mockData';
import TrainStatusCard from '../components/TrainStatusCard';
import RouteMap from '../components/RouteMap';
import LiveClock from '../components/LiveClock';
import AIExplanationSuite from '../components/AIExplanationSuite';

// Speedometer widget
function SpeedGauge({ speedKmh = 0, maxSpeed = 130 }) {
  const pct = Math.min(speedKmh / maxSpeed, 1);
  const angle = -140 + pct * 280;
  const r = 44;
  const cx = 56, cy = 56;
  const arcPath = (startAngle, endAngle, radius) => {
    const toRad = a => (a * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };
  const color = speedKmh === 0 ? '#ef4444' : speedKmh < 60 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex flex-col items-center">
      <svg width="112" height="80" viewBox="0 0 112 80">
        {/* Track arc */}
        <path d={arcPath(-140, 140, r)} fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        {/* Value arc */}
        {pct > 0 && <path d={arcPath(-140, -140 + pct * 280, r)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />}
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + 36 * Math.cos(((angle) * Math.PI) / 180)}
          y2={cy + 36 * Math.sin(((angle) * Math.PI) / 180)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill={color} />
        {/* Speed text */}
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{Math.round(speedKmh)}</text>
        <text x={cx} y={cy + 32} textAnchor="middle" fontSize="8" fill="#64748b">km/h</text>
      </svg>
      <span className="text-[10px] font-semibold text-slate-500 -mt-1">
        {speedKmh === 0 ? 'HALTED' : speedKmh < 60 ? 'SLOW' : speedKmh < 100 ? 'CRUISING' : 'HIGH SPEED'}
      </span>
    </div>
  );
}

// Countdown timer to next station
function NextStationCountdown({ distanceKm = 0, speedKmh = 0 }) {
  const [seconds, setSeconds] = useState(null);

  useEffect(() => {
    if (!speedKmh || speedKmh < 1) { setSeconds(null); return; }
    const etaSeconds = Math.round((distanceKm / speedKmh) * 3600);
    setSeconds(etaSeconds);
    const timer = setInterval(() => {
      setSeconds(s => (s !== null && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [distanceKm, speedKmh]);

  if (seconds === null) return <span className="text-slate-400 text-xs">Halted</span>;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return (
    <span className="font-mono font-bold text-blue-600 text-sm">
      {h > 0 && `${h}h `}{m}m {String(s).padStart(2, '0')}s
    </span>
  );
}

// Delay severity bar
function DelaySeverityBar({ delayMinutes }) {
  const pct = Math.min((delayMinutes / 60) * 100, 100);
  const color = delayMinutes === 0 ? 'bg-green-500' : delayMinutes < 15 ? 'bg-amber-400' : delayMinutes < 30 ? 'bg-orange-500' : 'bg-red-600';
  const label = delayMinutes === 0 ? 'On Time' : delayMinutes < 15 ? 'Minor Delay' : delayMinutes < 30 ? 'Moderate' : 'Major Delay';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-semibold ${delayMinutes === 0 ? 'text-green-600' : 'text-red-600'}`}>{label}</span>
        <span className="text-[10px] text-slate-500">{delayMinutes > 0 ? `+${delayMinutes}m` : '0m'}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LiveTracking({ backendOnline }) {
  const [activeTrains, setActiveTrains] = useState([]);
  const [selected, setSelected] = useState('12723');
  const [statusData, setStatusData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const trainNos = ['12723', '12759', '17201'];

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        trainNos.map(async no => {
          try {
            return backendOnline ? await getTrainStatus(no) : getMockStatus(no);
          } catch { return null; }
        })
      );
      setActiveTrains(results.filter(Boolean));
    };
    fetchAll();
    handleSelect('12723');
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [backendOnline]);

  const handleSelect = async (no) => {
    setSelected(no);
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        backendOnline ? getTrainStatus(no) : getMockStatus(no),
        backendOnline ? getETAPrediction(no) : getMockPrediction(no),
      ]);
      setStatusData(s);
      setPrediction(p);
    } catch {
      setStatusData(getMockStatus(no));
      setPrediction(getMockPrediction(no));
    }
    setLoading(false);
  };

  const liveData = statusData?.live;
  const speedKmh = liveData?.current_speed_kmh ?? 0;
  const distanceToNext = liveData?.distance_to_next_station ?? 0;
  const nextStation = prediction?.station_etas?.find(s => s.status !== 'Passed');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Live Train Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time GPS status, live AI arrival predictions, and delay root-cause analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock variant="compact" />
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live · 30s Sync
          </div>
        </div>
      </div>

      {/* Active trains grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTrains.map(t => {
          const delay = t.live?.current_delay_minutes || 0;
          return (
            <button
              key={t.train_no}
              onClick={() => handleSelect(t.train_no)}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                selected === t.train_no
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Train size={16} className="text-blue-600" />
                  <span className="font-bold text-slate-800 text-sm">{t.train_no}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  t.live?.status === 'Running' ? 'text-green-600 bg-green-50 border-green-200' :
                  t.live?.status === 'Halted' ? 'text-red-600 bg-red-50 border-red-200' :
                  'text-slate-600 bg-slate-50 border-slate-200'
                }`}>
                  {t.live?.status || 'Unknown'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-0.5">{t.train_name}</p>
              <p className="text-[10px] text-slate-500 mb-3">{t.from_station} → {t.to_station}</p>

              {/* Delay severity bar */}
              <DelaySeverityBar delayMinutes={delay} />

              <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                At: <strong className="text-slate-700">{t.live?.current_station_name}</strong>
                {delay > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertTriangle size={9} className="text-orange-500" />
                    <span className="text-slate-600 truncate">{t.live?.primary_delay_reason}</span>
                  </div>
                )}
                {delay === 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <CheckCircle size={9} className="text-green-500" />
                    <span className="text-emerald-700">On Schedule · Clear corridor</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Live instrument panel for selected train */}
      {!loading && statusData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Speed Gauge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-start w-full">
              <Gauge size={14} className="text-blue-500" />
              Current Speed
            </div>
            <SpeedGauge speedKmh={speedKmh} />
          </div>

          {/* Next Station Countdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock size={14} className="text-indigo-500" />
              Next Station ETA
            </div>
            {nextStation ? (
              <>
                <p className="text-lg font-black text-slate-800 leading-tight">{nextStation.station_name}</p>
                <div className="text-xs text-slate-500">
                  <span>Arrives: </span>
                  <span className="font-semibold text-slate-700">{nextStation.predicted_arrival}</span>
                </div>
                <div className="text-xs text-slate-500">
                  <span>Time away: </span>
                  <NextStationCountdown distanceKm={distanceToNext} speedKmh={speedKmh} />
                </div>
                <div className="text-xs text-slate-500">
                  <span>Distance: </span>
                  <span className="font-semibold text-blue-700">{distanceToNext} km</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">No upcoming station data</p>
            )}
          </div>

          {/* Delay Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Radio size={14} className="text-orange-500" />
              Live Delay Status
            </div>
            <div>
              <p className={`text-3xl font-black ${(liveData?.current_delay_minutes || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {(liveData?.current_delay_minutes || 0) > 0 ? `+${liveData.current_delay_minutes}` : '0'}
                <span className="text-base font-semibold ml-1">min</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{liveData?.primary_delay_reason}</p>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Track Congestion</span>
                <span className={`font-semibold ${(liveData?.track_congestion || 0) > 0.5 ? 'text-red-600' : 'text-slate-700'}`}>
                  {Math.round((liveData?.track_congestion || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weather Factor</span>
                <span className="font-semibold text-slate-700">{Math.round((liveData?.weather_factor || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Speed Restriction</span>
                <span className={`font-semibold ${liveData?.speed_restriction ? 'text-red-600' : 'text-emerald-600'}`}>
                  {liveData?.speed_restriction ? 'Active' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected train detail */}
      {loading && <div className="h-48 bg-slate-100 rounded-2xl shimmer" />}
      {!loading && statusData && prediction && (
        <div className="space-y-6">
          <TrainStatusCard status={statusData} prediction={prediction} />
          <RouteMap prediction={prediction} status={statusData} />
          <AIExplanationSuite prediction={prediction} status={statusData} />
        </div>
      )}

      {!selected && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Activity size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600 font-medium">Select a train above to see live tracking</p>
        </div>
      )}
    </div>
  );
}
