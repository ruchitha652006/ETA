from sqlalchemy.orm import Session
from database.db import Train, Station, Schedule, LiveStatus, DelayHistory
from models.schemas import TrainStatusResponse, LiveStatusSchema, StationETA, PredictionResponse
from prediction.eta_engine import engine as prediction_engine
from typing import List, Optional
from datetime import datetime
import random


def search_trains(db: Session, query: str) -> List[Train]:
    """Search trains by number or name."""
    q = f"%{query}%"
    return db.query(Train).filter(
        (Train.train_no.ilike(q)) |
        (Train.train_name.ilike(q)) |
        (Train.from_station.ilike(q)) |
        (Train.to_station.ilike(q))
    ).filter(Train.is_active == True).all()


def get_train_status(db: Session, train_no: str) -> Optional[dict]:
    """Get full train status with live data."""
    train = db.query(Train).filter(Train.train_no == train_no).first()
    if not train:
        return None

    live = db.query(LiveStatus).filter(LiveStatus.train_id == train.id).first()

    # Simulate real-time updates (small speed/delay variations)
    if live:
        live.current_speed_kmh = max(0, live.current_speed_kmh + random.uniform(-3, 3))
        live.last_updated = datetime.now().strftime("%I:%M %p")
        db.commit()
        db.refresh(live)

    return {
        "train_no": train.train_no,
        "train_name": train.train_name,
        "from_station": train.from_station,
        "from_code": train.from_code,
        "to_station": train.to_station,
        "to_code": train.to_code,
        "train_type": train.train_type,
        "live": live,
    }


def get_upcoming_stations(db: Session, train_no: str) -> List[dict]:
    """Get all schedules for a train."""
    train = db.query(Train).filter(Train.train_no == train_no).first()
    if not train:
        return []
    return db.query(Schedule).filter(Schedule.train_id == train.id).order_by(Schedule.stop_number).all()


def get_eta_prediction(db: Session, train_no: str) -> Optional[dict]:
    """Run full ETA prediction for a train."""
    train = db.query(Train).filter(Train.train_no == train_no).first()
    if not train:
        return None

    live = db.query(LiveStatus).filter(LiveStatus.train_id == train.id).first()
    schedules = db.query(Schedule).filter(Schedule.train_id == train.id).order_by(Schedule.stop_number).all()

    if not live or not schedules:
        return None

    # Build schedule dicts
    schedule_dicts = []
    for s in schedules:
        schedule_dicts.append({
            "station_code": s.station_code,
            "station_name": s.station_name,
            "arrival_time": s.arrival_time,
            "departure_time": s.departure_time,
            "stop_number": s.stop_number,
            "distance_from_origin": s.distance_from_origin,
            "avg_halt_minutes": s.avg_halt_minutes,
        })

    # Get historical delay averages per station
    historical_delays = {}
    history_records = db.query(DelayHistory).filter(
        DelayHistory.train_no == train_no
    ).all()

    station_delay_sums = {}
    station_delay_counts = {}
    for h in history_records:
        code = h.station_code
        station_delay_sums[code] = station_delay_sums.get(code, 0) + h.delay_minutes
        station_delay_counts[code] = station_delay_counts.get(code, 0) + 1

    for code in station_delay_sums:
        historical_delays[code] = station_delay_sums[code] / station_delay_counts[code]

    # Run prediction engine
    result = prediction_engine.predict(
        schedules=schedule_dicts,
        current_station_code=live.current_station_code,
        current_delay_minutes=live.current_delay_minutes,
        current_speed_kmh=live.current_speed_kmh,
        distance_to_next_station=live.distance_to_next_station,
        track_congestion=live.track_congestion,
        weather_factor=live.weather_factor,
        speed_restriction=live.speed_restriction,
        historical_delays=historical_delays,
    )

    return {
        "train_no": train.train_no,
        "train_name": train.train_name,
        "total_expected_delay": result["total_expected_delay"],
        "prediction_confidence": result["prediction_confidence"],
        "current_speed": live.current_speed_kmh,
        "station_etas": result["station_etas"],
        "factors_applied": result["factors_applied"],
        "anomaly_detection": result.get("anomaly_detection", {}),
        "congestion_detection": result.get("congestion_detection", {}),
        "future_delays": result.get("future_delays", {}),
        "delay_reasons": result.get("delay_reasons", []),
        "primary_delay_reason": result.get("primary_delay_reason", {}),
        "delay_attribution_breakdown": result.get("delay_attribution_breakdown", []),
    }


def get_delay_history(db: Session, train_no: str) -> dict:
    """Get delay history with per-station averages."""
    records = db.query(DelayHistory).filter(DelayHistory.train_no == train_no).all()

    by_station = {}
    history_list = []

    for r in records:
        if r.station_code not in by_station:
            by_station[r.station_code] = {"total": 0, "count": 0}
        by_station[r.station_code]["total"] += r.delay_minutes
        by_station[r.station_code]["count"] += 1
        history_list.append({
            "station_code": r.station_code,
            "station_name": r.station_code,  # simplified
            "avg_historical_delay": r.delay_minutes,
            "date": r.date,
            "delay_minutes": r.delay_minutes,
        })

    avg_by_station = {
        code: round(data["total"] / data["count"], 1)
        for code, data in by_station.items()
    }

    return {
        "train_no": train_no,
        "history": history_list[-30:],  # last 30 records
        "avg_delay_by_station": avg_by_station,
    }
