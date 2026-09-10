import { useState, useEffect } from 'react';
import { Calendar, Clock, Radio } from 'lucide-react';

export default function LiveClock({ variant = 'header', showTimezone = true }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const timezoneStr = 'IST';

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{formatDate(now)}</span>
        <span className="text-slate-300">|</span>
        <span className="font-mono font-semibold text-slate-800">{formatTime(now)}</span>
        {showTimezone && <span className="text-[10px] text-slate-400 font-bold">{timezoneStr}</span>}
      </div>
    );
  }

  if (variant === 'map-hud') {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-2xl flex items-center gap-3 text-white">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
          <Radio size={13} className="text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">LIVE</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-700" />
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Calendar size={13} className="text-blue-400" />
          <span className="font-medium text-slate-200">{formatDate(now)}</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-700" />
        <div className="flex items-center gap-1.5 text-xs">
          <Clock size={13} className="text-amber-400" />
          <span className="font-mono font-bold tracking-wide text-white text-sm">{formatTime(now)}</span>
          {showTimezone && (
            <span className="text-[10px] bg-blue-500/20 border border-blue-400/30 text-blue-300 px-1.5 py-0.5 rounded font-mono">
              {timezoneStr}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default 'header' style
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/90 rounded-xl shadow-xs">
      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
        <Calendar size={14} className="text-blue-600" />
        <span className="font-semibold text-slate-700">{formatDate(now)}</span>
      </div>

      <div className="w-1 h-1 rounded-full bg-slate-300" />

      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-indigo-600" />
        <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
          {formatTime(now)}
        </span>
        {showTimezone && (
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md">
            {timezoneStr}
          </span>
        )}
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Live clock sync" />
      </div>
    </div>
  );
}
