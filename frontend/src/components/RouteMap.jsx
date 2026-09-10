import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Train,
  Layers,
  Maximize2,
  Minimize2,
  Crosshair,
  Compass,
  Gauge,
  Calendar,
  Clock,
  Radio,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { getStationCoordinates } from '../data/stationCoordinates';
import LiveClock from './LiveClock';

const MAP_THEMES = {
  dark: {
    name: 'Dark Mode',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19,
    className: 'map-tiles-dark'
  },
  osm: {
    name: 'Standard Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  hot: {
    name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  terrain: {
    name: 'Terrain View',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    subdomains: 'abc',
    maxZoom: 17,
  }
};

const stationColors = {
  Passed:  { dot: '#10b981', line: '#10b981', text: 'text-slate-500', label: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  Current: { dot: '#3b82f6', line: '#94a3b8', text: 'text-blue-700',  label: 'bg-blue-100 text-blue-700 border-blue-200' },
  Delayed: { dot: '#f59e0b', line: '#94a3b8', text: 'text-slate-600', label: 'bg-amber-50 text-amber-700 border-amber-200' },
  'On Time': { dot: '#10b981', line: '#94a3b8', text: 'text-slate-600', label: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  default: { dot: '#94a3b8', line: '#cbd5e1', text: 'text-slate-500', label: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function RouteMap({ prediction, status }) {
  const [viewMode, setViewMode] = useState('geo'); // 'geo' | 'schematic'
  const [activeTheme, setActiveTheme] = useState('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const cardContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  const etas = prediction?.station_etas || [];
  const currentStationName = status?.live?.current_station_name || '';
  const currentSpeed = status?.live?.current_speed_kmh ?? prediction?.current_speed ?? 0;
  const currentDelay = status?.live?.current_delay_minutes ?? prediction?.total_expected_delay ?? 0;
  const trainNo = status?.train_no || prediction?.train_no || 'Train';
  const trainName = status?.train_name || prediction?.train_name || 'Express';

  // Calculate coordinates for all stations
  const stationsWithCoords = etas.map((eta, idx) => {
    const coords = getStationCoordinates(eta.station_code, eta.station_name, idx, etas.length);
    return {
      ...eta,
      lat: coords[0],
      lng: coords[1],
    };
  });

  // Calculate train live position
  const currentIndex = stationsWithCoords.findIndex(s => s.status === 'Current');
  let trainCoords = [17.3850, 78.4867];
  if (currentIndex >= 0 && stationsWithCoords[currentIndex]) {
    const curr = stationsWithCoords[currentIndex];
    const next = stationsWithCoords[currentIndex + 1];
    if (next) {
      // Estimate train position partway between current and next station
      const distToNext = status?.live?.distance_to_next_station || 20;
      const totalSegDist = Math.max(1, (next.distance_from_origin || 50) - (curr.distance_from_origin || 0));
      const ratio = Math.min(0.85, Math.max(0.15, 1 - (distToNext / totalSegDist)));
      trainCoords = [
        curr.lat + (next.lat - curr.lat) * ratio,
        curr.lng + (next.lng - curr.lng) * ratio,
      ];
    } else {
      trainCoords = [curr.lat, curr.lng];
    }
  } else if (stationsWithCoords.length > 0) {
    trainCoords = [stationsWithCoords[0].lat, stationsWithCoords[0].lng];
  }

  // Initialize and update Leaflet map
  useEffect(() => {
    if (viewMode !== 'geo' || !mapContainerRef.current) return;

    // Guard: if container already has a leaflet instance, tear it down first
    if (mapContainerRef.current._leaflet_id) {
      try {
        if (leafletMapRef.current) {
          leafletMapRef.current.stop();
          leafletMapRef.current.remove();
        } else {
          // Orphaned instance — clear the id so Leaflet can re-init cleanly
          delete mapContainerRef.current._leaflet_id;
        }
      } catch (e) { /* ignore */ }
      leafletMapRef.current = null;
    }

    if (stationsWithCoords.length === 0) return;

    let cancelled = false;

    // Initialize map centered on train or route center
    const map = L.map(mapContainerRef.current, {
      center: trainCoords,
      zoom: 7,
      zoomControl: false,
    });
    if (cancelled) { map.remove(); return; }
    leafletMapRef.current = map;

    // Add Tile Layer
    const themeConfig = MAP_THEMES[activeTheme] || MAP_THEMES.dark;
    const tileLayer = L.tileLayer(themeConfig.url, {
      attribution: themeConfig.attribution,
      subdomains: themeConfig.subdomains,
      maxZoom: themeConfig.maxZoom,
      className: themeConfig.className || '',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Custom Station Markers
    markersRef.current = [];
    polylinesRef.current = [];

    // Polyline: split into passed and upcoming
    const allCoords = stationsWithCoords.map(s => [s.lat, s.lng]);
    const passedCoords = [];
    const upcomingCoords = [];
    let passedCurrent = false;

    stationsWithCoords.forEach((st) => {
      if (st.status === 'Passed') {
        passedCoords.push([st.lat, st.lng]);
      } else if (st.status === 'Current') {
        passedCoords.push([st.lat, st.lng]);
        upcomingCoords.push([st.lat, st.lng]);
        passedCurrent = true;
      } else {
        upcomingCoords.push([st.lat, st.lng]);
      }
    });

    // If train is between stations, include train coordinates
    if (passedCoords.length > 0) {
      passedCoords.push(trainCoords);
    }
    if (upcomingCoords.length > 0) {
      upcomingCoords.unshift(trainCoords);
    }

    // Glow background line
    if (allCoords.length > 1) {
      const glowLine = L.polyline(allCoords, {
        color: '#3b82f6',
        weight: 8,
        opacity: 0.2,
      }).addTo(map);
      polylinesRef.current.push(glowLine);
    }

    // Passed Route (Solid Green)
    if (passedCoords.length > 1) {
      const passedLine = L.polyline(passedCoords, {
        color: '#10b981',
        weight: 4.5,
        opacity: 0.9,
      }).addTo(map);
      polylinesRef.current.push(passedLine);
    }

    // Upcoming Route (Dashed High-contrast Blue/Amber)
    if (upcomingCoords.length > 1) {
      const upcomingLine = L.polyline(upcomingCoords, {
        color: currentDelay > 20 ? '#f59e0b' : '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '7, 8',
      }).addTo(map);
      polylinesRef.current.push(upcomingLine);
    }

    // Station Markers
    stationsWithCoords.forEach((st, idx) => {
      const isCurrent = st.status === 'Current';
      const isPassed = st.status === 'Passed';
      const badgeColor = isCurrent ? '#3b82f6' : isPassed ? '#10b981' : '#64748b';
      const symbol = isPassed ? '✓' : isCurrent ? '●' : `${idx + 1}`;

      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            width: ${isCurrent ? '26px' : '20px'};
            height: ${isCurrent ? '26px' : '20px'};
            background: ${badgeColor};
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${badgeColor}80, 0 4px 6px -1px rgba(0,0,0,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
          ">
            ${symbol}
          </div>
          <div style="
            margin-top: 3px;
            background: rgba(15, 23, 42, 0.9);
            color: #f8fafc;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.15);
            white-space: nowrap;
            letter-spacing: 0.5px;
          ">
            ${st.station_code}
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-station-pin',
        iconSize: [40, 44],
        iconAnchor: [20, isCurrent ? 13 : 10],
      });

      const popupContent = `
        <div style="padding: 14px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div>
              <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8; letter-spacing: 1px;">Station Stop #${idx + 1}</span>
              <h3 style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 2px 0 0 0;">${st.station_name} (${st.station_code})</h3>
            </div>
            <span style="
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              background: ${isPassed ? '#065f46' : isCurrent ? '#1e40af' : '#334155'};
              color: ${isPassed ? '#6ee7b7' : isCurrent ? '#93c5fd' : '#cbd5e1'};
              border: 1px solid ${isPassed ? '#047857' : isCurrent ? '#2563eb' : '#475569'};
            ">${st.status}</span>
          </div>

          <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 8px;">
            <div>
              <div style="color: #94a3b8; font-size: 10px;">Scheduled</div>
              <div style="font-weight: 700; color: #f1f5f9;">${st.scheduled_arrival || '—'}</div>
            </div>
            <div>
              <div style="color: #94a3b8; font-size: 10px;">AI Predicted ETA</div>
              <div style="font-weight: 800; color: ${st.delay_minutes > 0 ? '#fbbf24' : '#34d399'};">${st.predicted_arrival || '—'}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; background: rgba(255,255,255,0.06); padding: 6px 10px; border-radius: 8px;">
            <span style="color: #cbd5e1;">Distance: <strong>${st.distance_from_origin || 0} km</strong></span>
            <span style="color: ${st.delay_minutes > 0 ? '#f87171' : '#34d399'}; font-weight: 700;">
              ${st.delay_minutes > 0 ? `+${st.delay_minutes} min delay` : 'On Time'}
            </span>
          </div>
        </div>
      `;

      const marker = L.marker([st.lat, st.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(popupContent);

      markersRef.current.push(marker);
    });

    // Train Live Locomotive Marker
    const trainIconHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div class="train-radar" style="
          position: absolute;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
        "></div>
        <div style="
          position: relative;
          z-index: 10;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: 3px solid #ffffff;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.9), 0 8px 16px rgba(0,0,0,0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="16" rx="2"></rect>
            <path d="M4 11h16"></path>
            <path d="M12 3v8"></path>
            <path d="m8 19-2 3"></path>
            <path d="m16 19 2 3"></path>
            <circle cx="8" cy="15" r="1"></circle>
            <circle cx="16" cy="15" r="1"></circle>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -20px;
          background: #1e3a8a;
          color: #93c5fd;
          border: 1px solid #3b82f6;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        ">
          ${currentSpeed > 0 ? `${currentSpeed} km/h` : 'HALTED'}
        </div>
      </div>
    `;

    const trainMarkerIcon = L.divIcon({
      html: trainIconHtml,
      className: 'live-train-locomotive-pin',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    const trainPopupHtml = `
      <div style="padding: 14px; min-width: 240px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 28px; height: 28px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
            🚂
          </div>
          <div>
            <h4 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 0;">${trainNo} ${trainName}</h4>
            <span style="font-size: 10px; color: #60a5fa; font-weight: 600;">Live GPS Position</span>
          </div>
        </div>
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
        <div style="font-size: 11px; space-y: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Current Location:</span>
            <strong style="color: #ffffff;">${currentStationName || 'En route'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Speed:</span>
            <strong style="color: #38bdf8;">${currentSpeed} km/h</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Delay Status:</span>
            <strong style="color: ${currentDelay > 0 ? '#f87171' : '#34d399'};">
              ${currentDelay > 0 ? `+${currentDelay} min delay` : 'On Time'}
            </strong>
          </div>
        </div>
      </div>
    `;

    const trainMarker = L.marker(trainCoords, { icon: trainMarkerIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(trainPopupHtml);

    markersRef.current.push(trainMarker);

    // Fit bounds
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }

    return () => {
      cancelled = true;
      try {
        map.stop();
        map.remove();
      } catch (e) {
        // ignore
      }
      leafletMapRef.current = null;
    };
  }, [viewMode, activeTheme, prediction, status]);

  // Handle layer theme switch
  const handleThemeChange = (themeKey) => {
    setActiveTheme(themeKey);
    if (leafletMapRef.current && tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
      const themeConfig = MAP_THEMES[themeKey];
      tileLayerRef.current = L.tileLayer(themeConfig.url, {
        attribution: themeConfig.attribution,
        subdomains: themeConfig.subdomains,
        maxZoom: themeConfig.maxZoom,
        className: themeConfig.className || '',
      }).addTo(leafletMapRef.current);
    }
  };

  // Recenter to train
  const handleRecenterTrain = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(trainCoords, 9, { duration: 1.2 });
    }
  };

  // Fit all stations
  const handleFitRoute = () => {
    if (leafletMapRef.current && stationsWithCoords.length > 0) {
      const allCoords = stationsWithCoords.map(s => [s.lat, s.lng]);
      leafletMapRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50], maxZoom: 10 });
    }
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!cardContainerRef.current) return;
    if (!document.fullscreenElement) {
      cardContainerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!prediction?.station_etas || prediction.station_etas.length === 0) {
    return null;
  }

  return (
    <div
      ref={cardContainerRef}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen ? 'p-4 bg-slate-900' : ''
      }`}
    >
      {/* ── Header Bar ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Navigation size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Route Map & GPS Tracking
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  ADVANCED
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span>Train {trainNo} · {trainName}</span>
              <span className="text-slate-500">•</span>
              <span>Current: <strong className="text-cyan-300">{currentStationName || 'In Transit'}</strong></span>
            </p>
          </div>
        </div>

        {/* Live Date & Time HUD on Header */}
        <div className="flex items-center gap-2.5">
          <LiveClock variant="map-hud" />

          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('geo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'geo'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass size={13} />
              <span>Interactive Map</span>
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'schematic'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              <span>Schematic View</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Map Body (Interactive Leaflet Map) ──────────────────── */}
      {viewMode === 'geo' && (
        <div className="relative w-full h-[480px] bg-slate-950 overflow-hidden">
          {/* Leaflet DOM container */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating On-Map HUD Controls (Top Right) */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
            {/* Theme switcher */}
            <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-1.5 shadow-xl flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Layers size={12} className="text-blue-400" /> Style:
              </span>
              {Object.entries(MAP_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    activeTheme === key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {theme.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Quick Actions (Recenter, Fit Route, Fullscreen) */}
            <div className="flex gap-2 self-end">
              <button
                onClick={handleRecenterTrain}
                title="Center on Train"
                className="flex items-center gap-1 text-xs px-3 py-2 bg-slate-900/90 hover:bg-blue-600 text-white border border-slate-700 rounded-xl shadow-lg transition-all backdrop-blur"
              >
                <Crosshair size={13} className="text-cyan-400" />
                <span className="font-semibold text-[11px]">Center Train</span>
              </button>
              <button
                onClick={handleFitRoute}
                title="Fit Entire Route"
                className="flex items-center gap-1 text-xs px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-xl shadow-lg transition-all backdrop-blur"
              >
                <Maximize2 size={13} className="text-indigo-400" />
                <span className="font-semibold text-[11px]">Full Route</span>
              </button>
              <button
                onClick={handleToggleFullscreen}
                title="Toggle Fullscreen"
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl shadow-lg transition-all backdrop-blur"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          {/* Floating On-Map Train Metrics Card (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-[400] max-w-sm bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-white">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Train size={16} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{trainNo} – {trainName}</h4>
                  <p className="text-[10px] text-slate-400">
                    At: <strong className="text-cyan-300">{currentStationName || 'Between Stations'}</strong>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                  currentDelay > 0
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {currentDelay > 0 ? `+${currentDelay}m delay` : 'On Time'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="bg-slate-800/60 p-1.5 rounded-lg">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Speed</span>
                <span className="text-xs font-bold text-cyan-400 font-mono">{currentSpeed} km/h</span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded-lg">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Next Halt</span>
                <span className="text-xs font-bold text-amber-400 truncate block">
                  {status?.live?.distance_to_next_station || '—'} km
                </span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded-lg">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total Route</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {etas[etas.length - 1]?.distance_from_origin || 0} km
                </span>
              </div>
            </div>
          </div>

          {/* Map Legend (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-[400] hidden sm:flex items-center gap-3 bg-slate-900/85 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" /> Passed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white animate-ping" /> Current
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" /> Upcoming
            </span>
          </div>
        </div>
      )}

      {/* ── Schematic Route Diagram View ─────────────────────────── */}
      {viewMode === 'schematic' && (
        <div className="px-6 py-10 overflow-x-auto bg-gradient-to-b from-white to-slate-50">
          <div className="min-w-[650px]">
            <div className="relative flex items-center justify-between">
              {etas.map((eta, idx) => {
                const isLast = idx === etas.length - 1;
                const isCurrent = eta.status === 'Current';
                const isPassed = eta.status === 'Passed';
                const sc = stationColors[eta.status] || stationColors.default;

                return (
                  <div key={eta.station_code} className="relative flex-1 flex items-center">
                    {/* Station dot + label */}
                    <div className="flex flex-col items-center relative z-10">
                      <div
                        className="relative transition-transform hover:scale-125"
                        style={{ width: isCurrent ? 32 : 22, height: isCurrent ? 32 : 22 }}
                      >
                        {isCurrent && (
                          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                        )}
                        <div
                          className="rounded-full border-4 border-white shadow-lg w-full h-full flex items-center justify-center text-white"
                          style={{
                            background: sc.dot,
                            boxShadow: isCurrent ? `0 0 0 5px ${sc.dot}35` : undefined,
                          }}
                        >
                          {isCurrent && <Train size={13} className="text-white" />}
                        </div>
                      </div>

                      {/* Station label */}
                      <div className={`absolute ${idx % 2 === 0 ? '-top-16' : 'top-10'} text-center w-24`}>
                        <p className={`text-xs font-black ${sc.text}`}>{eta.station_code}</p>
                        <p className="text-[10px] font-medium text-slate-500 truncate" title={eta.station_name}>
                          {eta.station_name}
                        </p>
                        <span className={`mt-1 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.label}`}>
                          {eta.status === 'Current' ? 'Live Now' : eta.status === 'Passed' ? 'Passed' : eta.predicted_arrival?.slice(0, 8) || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Connecting Line */}
                    {!isLast && (
                      <div
                        className="flex-1 h-1.5 mx-1 rounded-full transition-all"
                        style={{
                          background: isPassed
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : isCurrent
                            ? 'linear-gradient(90deg, #3b82f6, #cbd5e1)'
                            : '#e2e8f0',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Info Bar ──────────────────────────────────────── */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-blue-500" />
            Total Route: <strong className="text-slate-800">{etas[etas.length - 1]?.distance_from_origin || 0} km</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <Gauge size={13} className="text-indigo-500" />
            Distance to next station:
            <strong className="text-slate-800">{status?.live?.distance_to_next_station || '—'} km</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <Radio size={13} className="text-emerald-500" />
            Congestion Index: <strong className="text-slate-800">{prediction?.factors_applied?.track_congestion || 'Normal'}</strong>
          </span>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time GPS Track & Schedule Synced</span>
        </div>
      </div>
    </div>
  );
}
