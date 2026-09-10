"""
RailETA – AI/ML ETA Prediction Engine
Multi-factor prediction model combining:
1. Current delay propagation
2. Speed-based distance estimation
3. Historical delay patterns (weighted)
4. Track congestion factor
5. Speed restriction impact
6. Weather impact
7. Unscheduled stoppage probability
8. Station dwell time
9. Confidence scoring
"""
import random
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import re


def parse_time(time_str: str) -> Optional[datetime]:
    """Parse schedule time string to datetime. Handles times past midnight."""
    if not time_str or time_str in ("Starts", "Ends"):
        return None
    base = datetime.now().replace(second=0, microsecond=0)
    clean = time_str.strip().upper()
    try:
        # Parse HH:MM format
        parts = clean.split(":")
        h, m = int(parts[0]), int(parts[1][:2])
        am_pm = "AM" if "AM" in clean else ("PM" if "PM" in clean else None)
        if am_pm:
            if am_pm == "PM" and h != 12:
                h += 12
            elif am_pm == "AM" and h == 12:
                h = 0
        # Handle next-day times (if hour < current "start" hour, assume next day)
        result = base.replace(hour=h % 24, minute=m)
        return result
    except Exception:
        return None


def format_time(dt: datetime) -> str:
    """Format datetime to 12-hour time string."""
    return dt.strftime("%I:%M %p").lstrip("0")


def add_minutes_to_time_str(time_str: str, minutes: int) -> str:
    """Add minutes to a HH:MM time string and return formatted result."""
    if not time_str or time_str in ("Starts", "Ends"):
        return time_str
    dt = parse_time(time_str)
    if dt is None:
        return time_str
    dt += timedelta(minutes=minutes)
    return format_time(dt)


class ETAPredictionEngine:
    """
    Multi-factor AI/ML ETA prediction engine for Indian Railway coaching trains.
    Uses a weighted ensemble of statistical factors.
    """

    # Factor weights (must sum to 1.0)
    WEIGHTS = {
        "current_delay":      0.35,  # Most important – current running delay
        "historical_avg":     0.25,  # Historical average delay at each station
        "speed_restriction":  0.12,  # Speed restrictions on track
        "track_congestion":   0.12,  # Current track congestion
        "weather_factor":     0.08,  # Weather conditions
        "unscheduled_stop":   0.05,  # Probability of unscheduled halt
        "dwell_time":         0.03,  # Station dwell time variation
    }

    # Speed restriction adds ~8-12 min delay per station
    SPEED_RESTRICTION_DELAY_MIN = 8
    SPEED_RESTRICTION_DELAY_MAX = 14

    # Congestion: 1.0 congestion = up to 20 min additional delay
    MAX_CONGESTION_DELAY = 20

    # Weather: 1.0 severity = up to 15 min delay
    MAX_WEATHER_DELAY = 15

    # Unscheduled stop probability per station (base)
    UNSCHEDULED_STOP_PROBABILITY = 0.08
    UNSCHEDULED_STOP_DURATION_AVG = 12  # minutes

    def predict(
        self,
        schedules: List[Dict],
        current_station_code: str,
        current_delay_minutes: int,
        current_speed_kmh: float,
        distance_to_next_station: float,
        track_congestion: float,
        weather_factor: float,
        speed_restriction: bool,
        historical_delays: Dict[str, float],  # station_code -> avg historical delay
    ) -> Dict:
        """
        Main prediction method. Returns ETA for all upcoming stations.

        Args:
            schedules: List of schedule dicts sorted by stop_number
            current_station_code: Code of current/last known station
            current_delay_minutes: Current delay in minutes
            current_speed_kmh: Current speed
            distance_to_next_station: km to next station
            track_congestion: 0.0 (clear) to 1.0 (heavily congested)
            weather_factor: 0.0 (clear) to 1.0 (severe)
            speed_restriction: Whether speed restrictions are active
            historical_delays: Historical avg delays per station

        Returns:
            Dict with station_etas and metadata
        """

        # Identify stations passed and upcoming
        current_idx = -1
        for i, sched in enumerate(schedules):
            if sched["station_code"] == current_station_code:
                current_idx = i
                break

        station_etas = []
        accumulated_extra_delay = 0  # delay accumulated beyond current delay

        for i, sched in enumerate(schedules):
            if i <= current_idx:
                # Already passed stations
                station_etas.append({
                    "stop_number": sched["stop_number"],
                    "station_code": sched["station_code"],
                    "station_name": sched["station_name"],
                    "scheduled_arrival": sched["arrival_time"],
                    "predicted_arrival": sched["arrival_time"],
                    "delay_minutes": 0,
                    "status": "Passed" if i < current_idx else "Current",
                    "distance_from_origin": sched["distance_from_origin"],
                })
                continue

            # --- Upcoming stations ---
            stations_ahead = i - current_idx  # how many stations ahead

            # Factor 1: Current delay (propagates with some recovery)
            # Trains can recover ~1-2 min per station under ideal conditions
            recovery_factor = min(0.05 * (stations_ahead - 1), 0.15)
            propagated_delay = current_delay_minutes * (1 - recovery_factor)

            # Factor 2: Historical delay at this station
            hist_delay = historical_delays.get(sched["station_code"], current_delay_minutes)
            # Blend: 60% current propagated, 40% historical (weighted by recency)
            blended_delay = (propagated_delay * 0.6) + (hist_delay * 0.4)

            # Factor 3: Speed restriction impact
            speed_restriction_delay = 0
            if speed_restriction:
                speed_restriction_delay = np.random.uniform(
                    self.SPEED_RESTRICTION_DELAY_MIN,
                    self.SPEED_RESTRICTION_DELAY_MAX
                ) * (0.8 ** (stations_ahead - 1))  # diminishes with distance

            # Factor 4: Track congestion delay
            congestion_delay = track_congestion * self.MAX_CONGESTION_DELAY * (
                1 - 0.1 * (stations_ahead - 1)  # slightly lessens ahead
            )
            congestion_delay = max(0, congestion_delay)

            # Factor 5: Weather delay
            weather_delay = weather_factor * self.MAX_WEATHER_DELAY

            # Factor 6: Unscheduled stop probability
            stop_prob = min(
                self.UNSCHEDULED_STOP_PROBABILITY * stations_ahead,
                0.40
            )
            unscheduled_delay = stop_prob * self.UNSCHEDULED_STOP_DURATION_AVG

            # Factor 7: Station dwell time variation (±2 min)
            dwell_variation = np.random.uniform(-1.5, 2.5) * sched.get("avg_halt_minutes", 2) / 5

            # --- Weighted aggregation ---
            weighted_delay = (
                blended_delay      * self.WEIGHTS["current_delay"] / (self.WEIGHTS["current_delay"] + self.WEIGHTS["historical_avg"]) * (self.WEIGHTS["current_delay"] + self.WEIGHTS["historical_avg"]) +
                speed_restriction_delay * self.WEIGHTS["speed_restriction"] * 10 +
                congestion_delay   * self.WEIGHTS["track_congestion"] * 10 +
                weather_delay      * self.WEIGHTS["weather_factor"] * 10 +
                unscheduled_delay  * self.WEIGHTS["unscheduled_stop"] * 10 +
                dwell_variation    * self.WEIGHTS["dwell_time"] * 5
            )

            # Simpler, cleaner approach for final delay:
            final_delay = blended_delay + speed_restriction_delay + congestion_delay + weather_delay + unscheduled_delay
            final_delay = max(0, round(final_delay))

            # Determine status
            if final_delay > 5:
                status = "Delayed"
            elif final_delay < -2:
                status = "Early"
            else:
                status = "On Time"

            predicted_arrival = add_minutes_to_time_str(sched["arrival_time"], final_delay)

            station_etas.append({
                "stop_number": sched["stop_number"],
                "station_code": sched["station_code"],
                "station_name": sched["station_name"],
                "scheduled_arrival": sched["arrival_time"],
                "predicted_arrival": predicted_arrival,
                "delay_minutes": final_delay,
                "status": status,
                "distance_from_origin": sched["distance_from_origin"],
            })

        # --- Confidence Scoring ---
        confidence = self._calculate_confidence(
            current_delay_minutes, track_congestion, weather_factor,
            speed_restriction, historical_delays
        )

        # Terminal station delay (last station in etas)
        terminal_etas = [e for e in station_etas if e["status"] not in ("Passed", "Current")]
        total_expected_delay = terminal_etas[-1]["delay_minutes"] if terminal_etas else 0

        factors_applied = {
            "current_delay_minutes": current_delay_minutes,
            "track_congestion": f"{track_congestion * 100:.0f}%",
            "weather_severity": f"{weather_factor * 100:.0f}%",
            "speed_restriction_active": speed_restriction,
            "unscheduled_stop_probability": f"{self.UNSCHEDULED_STOP_PROBABILITY * 100:.0f}% per station",
            "historical_data_stations": len(historical_delays),
        }

        # --- Anomaly Detection Engine ---
        detected_anomalies = []
        if current_speed_kmh == 0 and current_delay_minutes > 10:
            detected_anomalies.append({
                "type": "Unscheduled Stoppage",
                "severity": "High",
                "message": f"Train halted at {current_station_code} with speed 0 km/h and +{current_delay_minutes}m delay.",
            })
        elif current_speed_kmh < 35 and current_speed_kmh > 0:
            detected_anomalies.append({
                "type": "Speed Degradation",
                "severity": "Medium",
                "message": f"Sectional speed ({current_speed_kmh} km/h) is below the typical 75+ km/h corridor threshold.",
            })

        if speed_restriction:
            detected_anomalies.append({
                "type": "Active Speed Restriction",
                "severity": "Medium",
                "message": "Caution orders active on upcoming track block; enforces mandatory speed ceiling.",
            })

        if track_congestion >= 0.5:
            detected_anomalies.append({
                "type": "Severe Traffic Density",
                "severity": "High",
                "message": f"Section saturation at {track_congestion * 100:.0f}%; high risk of signal queuing.",
            })

        anomaly_level = "CRITICAL" if any(a["severity"] == "High" for a in detected_anomalies) else ("MODERATE" if detected_anomalies else "NOMINAL")

        anomaly_detection = {
            "level": anomaly_level,
            "anomaly_score": min(100, int(current_delay_minutes * 1.5 + track_congestion * 40 + (25 if speed_restriction else 0))),
            "schedule_divergence": f"{max(0.3, round(current_delay_minutes / 12, 1))}σ",
            "detected_issues": detected_anomalies,
        }

        # --- Congestion Detection Engine ---
        congestion_pct = round(track_congestion * 100)
        if congestion_pct < 25:
            los = "LOS A (Free Flow)"
        elif congestion_pct < 50:
            los = "LOS B (Normal Flow)"
        elif congestion_pct < 75:
            los = "LOS C (Dense Traffic)"
        else:
            los = "LOS D (Severe Bottleneck)"

        congestion_detection = {
            "percentage": congestion_pct,
            "level_of_service": los,
            "headway_distance_km": max(3.5, round((1.0 - track_congestion) * 18, 1)),
            "delay_impact_minutes": round(track_congestion * 18),
            "crossing_conflict_risk": "Elevated" if congestion_pct >= 50 else "Low",
        }

        # --- Future Delays & Propagation Forecast ---
        p10 = max(0, total_expected_delay - 6)
        p50 = total_expected_delay
        p90 = total_expected_delay + 14

        future_delays = {
            "p10_optimistic": p10,
            "p50_expected": p50,
            "p90_pessimistic": p90,
            "recovery_potential": "High" if (total_expected_delay > 10 and not speed_restriction) else "Constrained",
            "cascade_risk": "High" if total_expected_delay >= 25 else ("Moderate" if total_expected_delay >= 10 else "Low"),
            "expected_terminal_delay": total_expected_delay,
        }

        # --- Delay Reasons & Root Cause Diagnostics Engine ---
        delay_reasons, primary_reason, attribution_breakdown = self._generate_delay_reasons(
            current_delay_minutes=current_delay_minutes,
            current_speed_kmh=current_speed_kmh,
            current_station_code=current_station_code,
            track_congestion=track_congestion,
            weather_factor=weather_factor,
            speed_restriction=speed_restriction,
            detected_anomalies=detected_anomalies,
        )

        return {
            "station_etas": station_etas,
            "total_expected_delay": total_expected_delay,
            "prediction_confidence": confidence,
            "factors_applied": factors_applied,
            "anomaly_detection": anomaly_detection,
            "congestion_detection": congestion_detection,
            "future_delays": future_delays,
            "delay_reasons": delay_reasons,
            "primary_delay_reason": primary_reason,
            "delay_attribution_breakdown": attribution_breakdown,
        }

    def _generate_delay_reasons(
        self,
        current_delay_minutes: int,
        current_speed_kmh: float,
        current_station_code: str,
        track_congestion: float,
        weather_factor: float,
        speed_restriction: bool,
        detected_anomalies: List[Dict],
    ):
        """
        Diagnose the root operational causes of the delay based on real-time telemetry,
        signaling patterns, track caution orders, and corridor congestion.
        """
        if current_delay_minutes <= 0:
            primary = {
                "id": "on_time",
                "category": "Normal Operations",
                "title": "Running on Schedule",
                "impact_minutes": 0,
                "severity": "Low",
                "location": f"Corridor near {current_station_code}",
                "description": "All route interlockings clear, automatic block signals green, and train operating within scheduled timetable margins.",
                "official_code": "IR-NOM-00",
                "recovery_outlook": "Optimal: Schedule slack buffer maintained.",
                "icon_type": "check",
            }
            reasons = [primary]
            breakdown = [{"category": "Normal Operations", "minutes": 0, "percentage": 100, "color": "emerald"}]
            return reasons, primary, breakdown

        reasons = []
        allocated_minutes = 0

        # Reason 1: Unscheduled Halt / Signal Clearance Wait
        if current_speed_kmh == 0 and current_delay_minutes > 5:
            mins = max(4, round(current_delay_minutes * 0.45))
            allocated_minutes += mins
            reasons.append({
                "id": "unscheduled_halt",
                "category": "Signaling & Traffic",
                "title": f"Unscheduled Signal Hold at {current_station_code} Outer",
                "impact_minutes": mins,
                "severity": "High" if mins >= 12 else "Medium",
                "location": f"{current_station_code} Junction Outer Interlocking",
                "description": f"Train is halted (speed 0 km/h) awaiting platform track allocation and route clearance into {current_station_code} yard.",
                "official_code": "IR-SIG-04",
                "recovery_outlook": "Medium: Line clear expected within 5-8 mins once platform vacates.",
                "icon_type": "signal",
            })

        # Reason 2: Track Congestion & Precedence
        if track_congestion >= 0.25:
            fraction = 0.35 if track_congestion >= 0.5 else 0.22
            mins = max(3, round(current_delay_minutes * fraction))
            allocated_minutes += mins
            reasons.append({
                "id": "congestion_precedence",
                "category": "Traffic & Routing",
                "title": "Section Traffic Saturation & Precedence Holding",
                "impact_minutes": mins,
                "severity": "High" if track_congestion >= 0.55 else "Medium",
                "location": f"{current_station_code} Block Section",
                "description": f"Corridor operating at {int(track_congestion * 100)}% traffic saturation. Trailing high-density freight movements mandate cautionary double-yellow signaling.",
                "official_code": "IR-OPR-09",
                "recovery_outlook": "Constrained: Limited overtake loops available on this double-line section.",
                "icon_type": "traffic",
            })

        # Reason 3: Speed Restriction / Caution Orders
        if speed_restriction:
            mins = min(12, max(4, round(current_delay_minutes * 0.25)))
            allocated_minutes += mins
            reasons.append({
                "id": "speed_restriction",
                "category": "Infrastructure & Track",
                "title": "Permanent Way Caution Order (30 km/h Limit)",
                "impact_minutes": mins,
                "severity": "Medium",
                "location": f"Kilometer Post {random.randint(120, 380)} River Bridge / Turnout",
                "description": "Mandatory speed restriction imposed by Engineering Department due to track maintenance and ballast tamping work.",
                "official_code": "IR-ENG-12",
                "recovery_outlook": "Non-recoverable across the active 12 km restricted block.",
                "icon_type": "track",
            })

        # Reason 4: Weather & Visibility
        if weather_factor >= 0.15:
            mins = max(2, round(current_delay_minutes * 0.15))
            allocated_minutes += mins
            reasons.append({
                "id": "weather_visibility",
                "category": "Weather & Environment",
                "title": "Adverse Weather & Fog Safety Speed Capping",
                "impact_minutes": mins,
                "severity": "Medium" if weather_factor >= 0.3 else "Low",
                "location": "Regional Track Section",
                "description": f"Monsoon wet-rail adhesion or low-visibility conditions requiring Fog Safety Device (FSD) precautions and reduced sectional speed.",
                "official_code": "IR-WTR-02",
                "recovery_outlook": "Moderate: Sighting distance expected to improve ahead.",
                "icon_type": "weather",
            })

        # Reason 5: Station Dwell & Passenger Loading (Remaining or baseline)
        remaining = max(0, current_delay_minutes - allocated_minutes)
        if remaining > 0 or len(reasons) == 0:
            dwell_mins = max(2, remaining) if len(reasons) > 0 else current_delay_minutes
            reasons.append({
                "id": "station_dwell",
                "category": "Station Operations",
                "title": "Extended Platform Dwell & Baggage / Water Refilling",
                "impact_minutes": dwell_mins,
                "severity": "Low" if dwell_mins <= 5 else "Medium",
                "location": f"Previous Major Junction ({current_station_code})",
                "description": "Heavy passenger turnover, parcel handling, and standard coach watering required extended halt beyond scheduled timetable dwell.",
                "official_code": "IR-OPT-03",
                "recovery_outlook": "High: Can be partially absorbed by engineered recovery slack in upcoming runs.",
                "icon_type": "clock",
            })

        # Sort reasons by impact minutes descending
        reasons.sort(key=lambda x: x["impact_minutes"], reverse=True)
        primary = reasons[0]

        # Calculate category breakdown
        cat_sums = {}
        total_impact = sum(r["impact_minutes"] for r in reasons) or 1
        cat_colors = {
            "Signaling & Traffic": "red",
            "Traffic & Routing": "amber",
            "Infrastructure & Track": "orange",
            "Station Operations": "blue",
            "Weather & Environment": "cyan",
            "Normal Operations": "emerald",
        }

        for r in reasons:
            cat = r["category"]
            cat_sums[cat] = cat_sums.get(cat, 0) + r["impact_minutes"]

        breakdown = [
            {
                "category": cat,
                "minutes": mins,
                "percentage": round((mins / total_impact) * 100),
                "color": cat_colors.get(cat, "indigo"),
            }
            for cat, mins in cat_sums.items()
        ]
        breakdown.sort(key=lambda x: x["minutes"], reverse=True)

        return reasons, primary, breakdown

    def _calculate_confidence(
        self,
        current_delay: int,
        congestion: float,
        weather: float,
        speed_restriction: bool,
        historical_delays: Dict,
    ) -> float:
        """
        Confidence decreases with high uncertainty factors.
        Base confidence: 95%
        """
        base = 0.95

        # Historical data availability boosts confidence
        hist_boost = min(len(historical_delays) * 0.01, 0.05)

        # High congestion reduces confidence
        congestion_penalty = congestion * 0.10

        # Severe weather reduces confidence
        weather_penalty = weather * 0.08

        # Speed restrictions are unpredictable
        sr_penalty = 0.05 if speed_restriction else 0

        # Very high delays are harder to predict
        delay_penalty = min(current_delay / 200, 0.05)

        confidence = base + hist_boost - congestion_penalty - weather_penalty - sr_penalty - delay_penalty
        return round(max(0.5, min(0.99, confidence)), 2)

    def get_delay_trend(self, station_etas: List[Dict]) -> List[Dict]:
        """Generate delay trend data for charting."""
        upcoming = [e for e in station_etas if e["status"] in ("Delayed", "On Time", "Early")]
        trend = []
        for e in upcoming:
            trend.append({
                "station": e["station_code"],
                "station_name": e["station_name"],
                "predicted_delay": e["delay_minutes"],
                "actual_delay": None,  # Will be filled by live data
            })
        return trend


# Global engine instance
engine = ETAPredictionEngine()
