from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import sys
import os

# Ensure local modules are importable
sys.path.insert(0, os.path.dirname(__file__))

from database.db import get_db, init_db
from database.seed import seed_database
from services.train_service import (
    search_trains, get_train_status, get_upcoming_stations,
    get_eta_prediction, get_delay_history
)

app = FastAPI(
    title="RailETA API",
    description="AI/ML powered Indian Railway ETA Prediction System",
    version="1.0.0",
)

# CORS – allow frontend on any local port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize and seed database on first run."""
    init_db()
    try:
        seed_database()
    except Exception as e:
        print(f"Seed skipped (may already exist): {e}")


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"message": "RailETA API is running 🚂", "version": "1.0.0"}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy", "service": "RailETA Backend"}


# ─── Trains ────────────────────────────────────────────────────────────────────

@app.get("/api/trains/", tags=["Trains"])
def list_trains(db: Session = Depends(get_db)):
    """List all available trains."""
    from database.db import Train
    trains = db.query(Train).filter(Train.is_active == True).all()
    return [
        {
            "train_no": t.train_no,
            "train_name": t.train_name,
            "from_station": t.from_station,
            "from_code": t.from_code,
            "to_station": t.to_station,
            "to_code": t.to_code,
            "train_type": t.train_type,
        }
        for t in trains
    ]


@app.get("/api/trains/search", tags=["Trains"])
def search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """Search trains by number or name."""
    trains = search_trains(db, q)
    if not trains:
        return []
    return [
        {
            "train_no": t.train_no,
            "train_name": t.train_name,
            "from_station": t.from_station,
            "from_code": t.from_code,
            "to_station": t.to_station,
            "to_code": t.to_code,
            "train_type": t.train_type,
        }
        for t in trains
    ]


@app.get("/api/trains/{train_no}/status", tags=["Trains"])
def train_status(train_no: str, db: Session = Depends(get_db)):
    """Get current train status with live information."""
    status = get_train_status(db, train_no)
    if not status:
        raise HTTPException(status_code=404, detail=f"Train {train_no} not found")

    live = status.get("live")
    live_data = None
    if live:
        live_data = {
            "current_station_code": live.current_station_code,
            "current_station_name": live.current_station_name,
            "current_delay_minutes": live.current_delay_minutes,
            "current_speed_kmh": round(live.current_speed_kmh, 1),
            "distance_to_next_station": live.distance_to_next_station,
            "status": live.status,
            "last_updated": live.last_updated,
            "track_congestion": live.track_congestion,
            "weather_factor": live.weather_factor,
            "speed_restriction": live.speed_restriction,
            "primary_delay_reason": (
                "Running on Schedule — Clear line & signals" if live.current_delay_minutes <= 0 else
                f"Unscheduled Signal Hold at {live.current_station_code} Outer" if (live.current_speed_kmh == 0 and live.current_delay_minutes > 5) else
                f"Traffic Saturation & Precedence ({int(live.track_congestion * 100)}%)" if live.track_congestion >= 0.4 else
                "Permanent Way Caution Order (30 km/h)" if live.speed_restriction else
                "Adverse Weather & Fog Safety Protocol" if live.weather_factor >= 0.2 else
                "Platform Dwell & Signal Clearance"
            ),
        }

    return {
        "train_no": status["train_no"],
        "train_name": status["train_name"],
        "from_station": status["from_station"],
        "from_code": status["from_code"],
        "to_station": status["to_station"],
        "to_code": status["to_code"],
        "train_type": status["train_type"],
        "live": live_data,
    }


@app.get("/api/trains/{train_no}/location", tags=["Trains"])
def train_location(train_no: str, db: Session = Depends(get_db)):
    """Get current GPS location / station of train."""
    from database.db import Train, LiveStatus
    train = db.query(Train).filter(Train.train_no == train_no).first()
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_no} not found")
    live = db.query(LiveStatus).filter(LiveStatus.train_id == train.id).first()
    if not live:
        raise HTTPException(status_code=404, detail="No live data available")
    return {
        "train_no": train_no,
        "current_station_code": live.current_station_code,
        "current_station_name": live.current_station_name,
        "current_speed_kmh": round(live.current_speed_kmh, 1),
        "status": live.status,
        "last_updated": live.last_updated,
    }


@app.get("/api/trains/{train_no}/upcoming-stations", tags=["Trains"])
def upcoming_stations(train_no: str, db: Session = Depends(get_db)):
    """Get all upcoming station schedules for a train."""
    schedules = get_upcoming_stations(db, train_no)
    if not schedules:
        raise HTTPException(status_code=404, detail=f"No schedule found for train {train_no}")
    return [
        {
            "stop_number": s.stop_number,
            "station_code": s.station_code,
            "station_name": s.station_name,
            "arrival_time": s.arrival_time,
            "departure_time": s.departure_time,
            "distance_from_origin": s.distance_from_origin,
            "avg_halt_minutes": s.avg_halt_minutes,
        }
        for s in schedules
    ]


@app.get("/api/trains/{train_no}/eta-prediction", tags=["Prediction"])
def eta_prediction(train_no: str, db: Session = Depends(get_db)):
    """
    Run AI/ML ETA prediction for all upcoming stations.
    Uses multi-factor weighted prediction engine.
    """
    result = get_eta_prediction(db, train_no)
    if not result:
        raise HTTPException(status_code=404, detail=f"Cannot generate prediction for train {train_no}")
    return result


@app.get("/api/trains/{train_no}/delay-history", tags=["Analytics"])
def delay_history(train_no: str, db: Session = Depends(get_db)):
    """Get historical delay data for analytics and trend charts."""
    history = get_delay_history(db, train_no)
    return history
