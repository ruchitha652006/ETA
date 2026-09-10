// Mock data fallback — mirrors the exact API response shapes.
// Used when the backend is unavailable.

export const MOCK_TRAINS = [
  { train_no: "12723", train_name: "Telangana Express", from_station: "Hyderabad", from_code: "HYB", to_station: "Nellore", to_code: "NLR", train_type: "Superfast Express" },
  { train_no: "12759", train_name: "Charminar Express", from_station: "Hyderabad", from_code: "HYB", to_station: "Chennai Central", to_code: "MAS", train_type: "Superfast Express" },
  { train_no: "17201", train_name: "Golconda Express", from_station: "Secunderabad", from_code: "SC", to_station: "Chennai Central", to_code: "MAS", train_type: "Express" },
  { train_no: "12649", train_name: "Karnataka Sampark Kranti", from_station: "New Delhi", from_code: "NDLS", to_station: "Vijayawada", to_code: "BZA", train_type: "Superfast Express" },
  { train_no: "12724", train_name: "Telangana Express (Return)", from_station: "Nellore", from_code: "NLR", to_station: "Hyderabad", to_code: "HYB", train_type: "Superfast Express" },
];

export const MOCK_STATUS = {
  "12723": {
    train_no: "12723",
    train_name: "Telangana Express",
    from_station: "Hyderabad",
    from_code: "HYB",
    to_station: "Nellore",
    to_code: "NLR",
    train_type: "Superfast Express",
    live: {
      current_station_code: "HYB",
      current_station_name: "Hyderabad",
      current_delay_minutes: 18,
      current_speed_kmh: 62.0,
      distance_to_next_station: 148,
      status: "Running",
      last_updated: "10:18 PM",
      track_congestion: 0.35,
      weather_factor: 0.1,
      speed_restriction: false,
      primary_delay_reason: "Signal Precedence Hold at Kazipet Outer (+10m)",
    },
  },
  "12759": {
    train_no: "12759",
    train_name: "Charminar Express",
    from_station: "Hyderabad",
    from_code: "HYB",
    to_station: "Chennai Central",
    to_code: "MAS",
    train_type: "Superfast Express",
    live: {
      current_station_code: "KZJ",
      current_station_name: "Kazipet",
      current_delay_minutes: 5,
      current_speed_kmh: 85.0,
      distance_to_next_station: 9,
      status: "Running",
      last_updated: "10:22 PM",
      track_congestion: 0.15,
      weather_factor: 0.0,
      speed_restriction: false,
      primary_delay_reason: "Yard Throat Interlocking Cross-Over (+3m)",
    },
  },
  "17201": {
    train_no: "17201",
    train_name: "Golconda Express",
    from_station: "Secunderabad",
    from_code: "SC",
    to_station: "Chennai Central",
    to_code: "MAS",
    train_type: "Express",
    live: {
      current_station_code: "BZA",
      current_station_name: "Vijayawada",
      current_delay_minutes: 32,
      current_speed_kmh: 0.0,
      distance_to_next_station: 195,
      status: "Halted",
      last_updated: "10:05 PM",
      track_congestion: 0.6,
      weather_factor: 0.25,
      speed_restriction: true,
      primary_delay_reason: "Platform #1 Occupancy Contention at Vijayawada Outer (+18m)",
    },
  },
};

export const MOCK_PREDICTION = {
  "12723": {
    train_no: "12723",
    train_name: "Telangana Express",
    total_expected_delay: 25,
    prediction_confidence: 0.91,
    current_speed: 62.0,
    station_etas: [
      { stop_number: 1, station_code: "HYB", station_name: "Hyderabad", scheduled_arrival: "Starts", predicted_arrival: "Starts", delay_minutes: 0, status: "Current", distance_from_origin: 0 },
      { stop_number: 2, station_code: "KZJ", station_name: "Kazipet", scheduled_arrival: "10:24 PM", predicted_arrival: "10:42 PM", delay_minutes: 18, status: "Delayed", distance_from_origin: 148 },
      { stop_number: 3, station_code: "WL",  station_name: "Warangal", scheduled_arrival: "11:00 PM", predicted_arrival: "11:18 PM", delay_minutes: 18, status: "Delayed", distance_from_origin: 157 },
      { stop_number: 4, station_code: "MB",  station_name: "Mahabubabad", scheduled_arrival: "12:15 AM", predicted_arrival: "12:32 AM", delay_minutes: 17, status: "Delayed", distance_from_origin: 213 },
      { stop_number: 5, station_code: "BZA", station_name: "Vijayawada", scheduled_arrival: "02:10 AM", predicted_arrival: "02:35 AM", delay_minutes: 25, status: "Delayed", distance_from_origin: 430 },
      { stop_number: 6, station_code: "GNT", station_name: "Guntur", scheduled_arrival: "03:15 AM", predicted_arrival: "03:41 AM", delay_minutes: 26, status: "Delayed", distance_from_origin: 459 },
      { stop_number: 7, station_code: "OGL", station_name: "Ongole", scheduled_arrival: "04:30 AM", predicted_arrival: "04:57 AM", delay_minutes: 27, status: "Delayed", distance_from_origin: 555 },
      { stop_number: 8, station_code: "NLR", station_name: "Nellore", scheduled_arrival: "05:30 AM", predicted_arrival: "05:58 AM", delay_minutes: 28, status: "Delayed", distance_from_origin: 626 },
    ],
    factors_applied: {
      current_delay_minutes: 18,
      track_congestion: "35%",
      weather_severity: "10%",
      speed_restriction_active: false,
      unscheduled_stop_probability: "8% per station",
      historical_data_stations: 6,
    },
    anomaly_detection: {
      level: "MODERATE",
      anomaly_score: 42,
      schedule_divergence: "1.5σ",
      detected_issues: [
        { type: "Moderate Delay Drift", severity: "Medium", message: "Accumulated +18m delay against 30-day baseline average (+12m)." },
        { type: "Section Headway Margin", severity: "Low", message: "Running 11.7 km behind freight rake 402; automatic block signaling operative." }
      ]
    },
    congestion_detection: {
      percentage: 35,
      level_of_service: "LOS B (Normal Flow)",
      headway_distance_km: 11.7,
      delay_impact_minutes: 6,
      crossing_conflict_risk: "Low",
      bottleneck_node: "Kazipet Jn Interlocking",
    },
    future_delays: {
      p10_optimistic: 19,
      p50_expected: 25,
      p90_pessimistic: 39,
      recovery_potential: "Moderate (2.5m buffer available)",
      cascade_risk: "Moderate",
      expected_terminal_delay: 28,
    },
    delay_reasons: [
      {
        id: "sig_precedence_kzj",
        category: "Signaling & Traffic",
        title: "Signal Precedence Hold at Kazipet Outer Interlocking",
        impact_minutes: 10,
        severity: "High",
        location: "Kazipet Jn (KZJ) Outer Signal Home Cabin",
        description: "Held at outer home signal to accord operational precedence to 20834 Vande Bharat Express on the Secunderabad-Kazipet trunk route.",
        official_code: "IR-SIG-04",
        recovery_outlook: "Moderate: Line clear granted, train proceeding to yard junction.",
        icon_type: "signal"
      },
      {
        id: "auto_block_congestion",
        category: "Traffic & Routing",
        title: "Section Automatic Block Density & Caution Aspects",
        impact_minutes: 5,
        severity: "Medium",
        location: "Cherlapalli – Kazipet Quadruple Corridor",
        description: "High freight trailing volume created headway compression down to 11.7 km, enforcing recurring double-yellow caution signals (speed ceiling 45 km/h).",
        official_code: "IR-OPR-09",
        recovery_outlook: "Constrained: Dense traffic flow until Warangal junction.",
        icon_type: "traffic"
      },
      {
        id: "station_dwell_hyb",
        category: "Station Operations",
        title: "Heavy Boarding & Mail Parcel Loading Dwell",
        impact_minutes: 3,
        severity: "Low",
        location: "Hyderabad Deccan (HYB) Platform #4",
        description: "High passenger volume in non-AC coaches and heavy parcel express van loading extended station dwell beyond scheduled timetable departure.",
        official_code: "IR-OPT-03",
        recovery_outlook: "High: Buffer slack of 4 min available ahead towards Guntur.",
        icon_type: "clock"
      }
    ],
    primary_delay_reason: {
      id: "sig_precedence_kzj",
      category: "Signaling & Traffic",
      title: "Signal Precedence Hold at Kazipet Outer Interlocking",
      impact_minutes: 10,
      severity: "High",
      location: "Kazipet Jn (KZJ) Outer Signal Home Cabin",
      description: "Held at outer home signal to accord operational precedence to 20834 Vande Bharat Express on the Secunderabad-Kazipet trunk route.",
      official_code: "IR-SIG-04",
      recovery_outlook: "Moderate: Line clear granted, train proceeding to yard junction.",
      icon_type: "signal"
    },
    delay_attribution_breakdown: [
      { category: "Signaling & Traffic", minutes: 10, percentage: 56, color: "red" },
      { category: "Traffic & Routing", minutes: 5, percentage: 28, color: "amber" },
      { category: "Station Operations", minutes: 3, percentage: 16, color: "blue" }
    ],
  },
  "12759": {
    train_no: "12759",
    train_name: "Charminar Express",
    total_expected_delay: 7,
    prediction_confidence: 0.95,
    current_speed: 85.0,
    station_etas: [
      { stop_number: 1, station_code: "HYB", station_name: "Hyderabad", scheduled_arrival: "Starts", predicted_arrival: "Starts", delay_minutes: 0, status: "Passed", distance_from_origin: 0 },
      { stop_number: 2, station_code: "SC",  station_name: "Secunderabad", scheduled_arrival: "3:45 PM", predicted_arrival: "3:45 PM", delay_minutes: 0, status: "Passed", distance_from_origin: 5 },
      { stop_number: 3, station_code: "KZJ", station_name: "Kazipet", scheduled_arrival: "5:45 PM", predicted_arrival: "5:50 PM", delay_minutes: 5, status: "Current", distance_from_origin: 148 },
      { stop_number: 4, station_code: "WL",  station_name: "Warangal", scheduled_arrival: "6:10 PM", predicted_arrival: "6:15 PM", delay_minutes: 5, status: "Delayed", distance_from_origin: 157 },
      { stop_number: 5, station_code: "BZA", station_name: "Vijayawada", scheduled_arrival: "9:00 PM", predicted_arrival: "9:07 PM", delay_minutes: 7, status: "Delayed", distance_from_origin: 430 },
      { stop_number: 6, station_code: "NLR", station_name: "Nellore", scheduled_arrival: "11:45 PM", predicted_arrival: "11:52 PM", delay_minutes: 7, status: "Delayed", distance_from_origin: 626 },
      { stop_number: 7, station_code: "MAS", station_name: "Chennai Central", scheduled_arrival: "4:00 AM", predicted_arrival: "4:07 AM", delay_minutes: 7, status: "Delayed", distance_from_origin: 793 },
    ],
    factors_applied: {
      current_delay_minutes: 5,
      track_congestion: "15%",
      weather_severity: "0%",
      speed_restriction_active: false,
      unscheduled_stop_probability: "8% per station",
      historical_data_stations: 0,
    },
    anomaly_detection: {
      level: "NOMINAL",
      anomaly_score: 12,
      schedule_divergence: "0.4σ",
      detected_issues: []
    },
    congestion_detection: {
      percentage: 15,
      level_of_service: "LOS A (Free Flow)",
      headway_distance_km: 15.3,
      delay_impact_minutes: 2,
      crossing_conflict_risk: "Negligible",
      bottleneck_node: "Clear Corridor",
    },
    future_delays: {
      p10_optimistic: 2,
      p50_expected: 7,
      p90_pessimistic: 18,
      recovery_potential: "High (3.5m slack buffer)",
      cascade_risk: "Low",
      expected_terminal_delay: 7,
    },
    delay_reasons: [
      {
        id: "kzj_yard_slack",
        category: "Traffic & Routing",
        title: "Yard Interlocking Throat Route Cross-Over",
        impact_minutes: 3,
        severity: "Low",
        location: "Kazipet Yard South Throat",
        description: "Routine routing cross-over deceleration (speed 15 km/h) through diamond crossing points during yard switch.",
        official_code: "IR-YRD-01",
        recovery_outlook: "High: Clear mainline ahead on Warangal-Vijayawada block.",
        icon_type: "traffic"
      },
      {
        id: "secunderabad_dwell",
        category: "Station Operations",
        title: "Passenger Boarding & Dwell Fluctuation",
        impact_minutes: 2,
        severity: "Low",
        location: "Secunderabad Jn (SC) Platform #1",
        description: "Minor 2-minute dwell extension during commuter boarding rush.",
        official_code: "IR-OPT-02",
        recovery_outlook: "Optimal: 3.5 min recovery slack scheduled before Vijayawada.",
        icon_type: "clock"
      }
    ],
    primary_delay_reason: {
      id: "kzj_yard_slack",
      category: "Traffic & Routing",
      title: "Yard Interlocking Throat Route Cross-Over",
      impact_minutes: 3,
      severity: "Low",
      location: "Kazipet Yard South Throat",
      description: "Routine routing cross-over deceleration (speed 15 km/h) through diamond crossing points during yard switch.",
      official_code: "IR-YRD-01",
      recovery_outlook: "High: Clear mainline ahead on Warangal-Vijayawada block.",
      icon_type: "traffic"
    },
    delay_attribution_breakdown: [
      { category: "Traffic & Routing", minutes: 3, percentage: 60, color: "amber" },
      { category: "Station Operations", minutes: 2, percentage: 40, color: "blue" }
    ],
  },
  "17201": {
    train_no: "17201",
    train_name: "Golconda Express",
    total_expected_delay: 42,
    prediction_confidence: 0.76,
    current_speed: 0.0,
    station_etas: [
      { stop_number: 1, station_code: "SC",  station_name: "Secunderabad", scheduled_arrival: "Starts", predicted_arrival: "Starts", delay_minutes: 0, status: "Passed", distance_from_origin: 0 },
      { stop_number: 2, station_code: "KZJ", station_name: "Kazipet", scheduled_arrival: "8:10 AM", predicted_arrival: "8:42 AM", delay_minutes: 32, status: "Passed", distance_from_origin: 145 },
      { stop_number: 3, station_code: "BZA", station_name: "Vijayawada", scheduled_arrival: "11:30 AM", predicted_arrival: "12:02 PM", delay_minutes: 32, status: "Current", distance_from_origin: 428 },
      { stop_number: 4, station_code: "NLR", station_name: "Nellore", scheduled_arrival: "2:30 PM", predicted_arrival: "3:12 PM", delay_minutes: 42, status: "Delayed", distance_from_origin: 623 },
      { stop_number: 5, station_code: "MAS", station_name: "Chennai Central", scheduled_arrival: "7:30 PM", predicted_arrival: "8:12 PM", delay_minutes: 42, status: "Delayed", distance_from_origin: 791 },
    ],
    factors_applied: {
      current_delay_minutes: 32,
      track_congestion: "60%",
      weather_severity: "25%",
      speed_restriction_active: true,
      unscheduled_stop_probability: "8% per station",
      historical_data_stations: 0,
    },
    anomaly_detection: {
      level: "CRITICAL",
      anomaly_score: 88,
      schedule_divergence: "2.7σ",
      detected_issues: [
        { type: "Unscheduled Halted State", severity: "High", message: "Train stationary at Vijayawada Outer (speed 0 km/h) for >18 mins." },
        { type: "Active Track Caution Order", severity: "Medium", message: "Permanent speed restriction (30 km/h) on Krishna River rail bridge." },
        { type: "Platform Occupancy Contention", severity: "High", message: "BZA Platform #1 occupied by 12616 Grand Trunk Express." }
      ]
    },
    congestion_detection: {
      percentage: 60,
      level_of_service: "LOS C (Dense Traffic)",
      headway_distance_km: 7.2,
      delay_impact_minutes: 11,
      crossing_conflict_risk: "Elevated",
      bottleneck_node: "BZA Yard Junction Interlocking",
    },
    future_delays: {
      p10_optimistic: 36,
      p50_expected: 42,
      p90_pessimistic: 58,
      recovery_potential: "Constrained (Heavy caution orders)",
      cascade_risk: "High",
      expected_terminal_delay: 42,
    },
    delay_reasons: [
      {
        id: "platform_contention_bza",
        category: "Signaling & Traffic",
        title: "Platform Occupancy Contention at Vijayawada Outer",
        impact_minutes: 18,
        severity: "High",
        location: "Vijayawada Jn (BZA) Krishna Canal Junction Outer",
        description: "Train halted (speed 0 km/h) for 18 minutes outside Vijayawada because designated Platform #1 remains occupied by 12616 Grand Trunk Express.",
        official_code: "IR-PFM-02",
        recovery_outlook: "Constrained: Awaiting departure of 12616 before route can be set.",
        icon_type: "signal"
      },
      {
        id: "krishna_bridge_tsr",
        category: "Infrastructure & Track",
        title: "Permanent Speed Restriction (30 km/h) on Krishna Rail Bridge",
        impact_minutes: 8,
        severity: "Medium",
        location: "Krishna River Major Rail Bridge #42",
        description: "Permanent Way engineering caution order strictly capping bridge traversal velocity to 30 km/h for steel girder vibration safety.",
        official_code: "IR-ENG-12",
        recovery_outlook: "Non-recoverable: Enforced structural speed limit.",
        icon_type: "track"
      },
      {
        id: "monsoon_weather_adhesion",
        category: "Weather & Environment",
        title: "Monsoon Track Wetness & Reduced Adhesion Braking Margin",
        impact_minutes: 6,
        severity: "Medium",
        location: "South Central Costal Delta Zone",
        description: "Intermittent heavy monsoon showers creating railhead wheel-slip conditions, mandating conservative brake application and gradual acceleration curves.",
        official_code: "IR-WTR-02",
        recovery_outlook: "Moderate: Weather radar predicts rain easing past Tenali.",
        icon_type: "weather"
      }
    ],
    primary_delay_reason: {
      id: "platform_contention_bza",
      category: "Signaling & Traffic",
      title: "Platform Occupancy Contention at Vijayawada Outer",
      impact_minutes: 18,
      severity: "High",
      location: "Vijayawada Jn (BZA) Krishna Canal Junction Outer",
      description: "Train halted (speed 0 km/h) for 18 minutes outside Vijayawada because designated Platform #1 remains occupied by 12616 Grand Trunk Express.",
      official_code: "IR-PFM-02",
      recovery_outlook: "Constrained: Awaiting departure of 12616 before route can be set.",
      icon_type: "signal"
    },
    delay_attribution_breakdown: [
      { category: "Signaling & Traffic", minutes: 18, percentage: 56, color: "red" },
      { category: "Infrastructure & Track", minutes: 8, percentage: 25, color: "orange" },
      { category: "Weather & Environment", minutes: 6, percentage: 19, color: "cyan" }
    ],
  },
};

export const MOCK_DELAY_HISTORY = {
  "12723": {
    train_no: "12723",
    avg_delay_by_station: { HYB: 5, KZJ: 17, WL: 18, MB: 19, BZA: 24, NLR: 27 },
    history: [
      { station_code: "HYB", station_name: "Hyderabad",   delay_minutes: 0,  date: "2026-09-08" },
      { station_code: "KZJ", station_name: "Kazipet",     delay_minutes: 15, date: "2026-09-08" },
      { station_code: "WL",  station_name: "Warangal",    delay_minutes: 16, date: "2026-09-08" },
      { station_code: "MB",  station_name: "Mahabubabad", delay_minutes: 18, date: "2026-09-08" },
      { station_code: "BZA", station_name: "Vijayawada",  delay_minutes: 22, date: "2026-09-08" },
      { station_code: "NLR", station_name: "Nellore",     delay_minutes: 25, date: "2026-09-08" },
    ],
  },
};

export function getMockStatus(trainNo) {
  return MOCK_STATUS[trainNo] || null;
}

export function getMockPrediction(trainNo) {
  return MOCK_PREDICTION[trainNo] || null;
}

export function getMockDelayHistory(trainNo) {
  return MOCK_DELAY_HISTORY[trainNo] || { train_no: trainNo, avg_delay_by_station: {}, history: [] };
}
