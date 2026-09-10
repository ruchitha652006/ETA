from pydantic import BaseModel
from typing import Optional, List


class StationBase(BaseModel):
    station_code: str
    station_name: str
    zone: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TrainBase(BaseModel):
    train_no: str
    train_name: str
    from_station: str
    from_code: str
    to_station: str
    to_code: str
    train_type: Optional[str] = "Express"


class TrainSummary(TrainBase):
    id: int

    class Config:
        from_attributes = True


class ScheduleItem(BaseModel):
    station_code: str
    station_name: str
    arrival_time: str
    departure_time: str
    stop_number: int
    distance_from_origin: float
    avg_halt_minutes: int

    class Config:
        from_attributes = True


class LiveStatusSchema(BaseModel):
    current_station_code: str
    current_station_name: str
    current_delay_minutes: int
    current_speed_kmh: float
    distance_to_next_station: float
    status: str
    last_updated: str
    track_congestion: float
    weather_factor: float
    speed_restriction: bool
    primary_delay_reason: Optional[str] = None

    class Config:
        from_attributes = True


class TrainStatusResponse(BaseModel):
    train_no: str
    train_name: str
    from_station: str
    from_code: str
    to_station: str
    to_code: str
    train_type: str
    live: Optional[LiveStatusSchema] = None


class StationETA(BaseModel):
    stop_number: int
    station_code: str
    station_name: str
    scheduled_arrival: str
    predicted_arrival: str
    delay_minutes: int
    status: str  # "On Time" | "Delayed" | "Passed" | "Current"
    distance_from_origin: float


class PredictionResponse(BaseModel):
    train_no: str
    train_name: str
    total_expected_delay: int
    prediction_confidence: float
    current_speed: float
    station_etas: List[StationETA]
    factors_applied: dict
    anomaly_detection: Optional[dict] = None
    congestion_detection: Optional[dict] = None
    future_delays: Optional[dict] = None
    delay_reasons: Optional[List[dict]] = None
    primary_delay_reason: Optional[dict] = None
    delay_attribution_breakdown: Optional[List[dict]] = None


class DelayHistoryPoint(BaseModel):
    station_code: str
    station_name: str
    avg_historical_delay: float
    date: str
    delay_minutes: int


class DelayHistoryResponse(BaseModel):
    train_no: str
    history: List[DelayHistoryPoint]
    avg_delay_by_station: dict
