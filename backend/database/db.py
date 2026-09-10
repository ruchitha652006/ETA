from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
import os

# Load the project-root .env.local file when running locally
load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        ".env.local",
    )
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./raileta.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Train(Base):
    __tablename__ = "trains"
    id = Column(Integer, primary_key=True, index=True)
    train_no = Column(String, unique=True, index=True)
    train_name = Column(String)
    from_station = Column(String)
    from_code = Column(String)
    to_station = Column(String)
    to_code = Column(String)
    train_type = Column(String, default="Express")
    is_active = Column(Boolean, default=True)
    schedules = relationship("Schedule", back_populates="train")
    live_status = relationship("LiveStatus", back_populates="train", uselist=False)


class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String, unique=True, index=True)
    station_name = Column(String)
    zone = Column(String)
    state = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"))
    station_code = Column(String, index=True)
    station_name = Column(String)
    arrival_time = Column(String)
    departure_time = Column(String)
    stop_number = Column(Integer)
    distance_from_origin = Column(Float)
    avg_halt_minutes = Column(Integer, default=2)
    train = relationship("Train", back_populates="schedules")


class LiveStatus(Base):
    __tablename__ = "live_status"
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), unique=True)
    current_station_code = Column(String)
    current_station_name = Column(String)
    current_delay_minutes = Column(Integer, default=0)
    current_speed_kmh = Column(Float, default=0)
    distance_to_next_station = Column(Float, default=0)
    status = Column(String, default="Running")
    last_updated = Column(String)
    track_congestion = Column(Float, default=0.0)  # 0-1 scale
    weather_factor = Column(Float, default=0.0)    # 0-1 scale
    speed_restriction = Column(Boolean, default=False)
    train = relationship("Train", back_populates="live_status")


class DelayHistory(Base):
    __tablename__ = "delay_history"
    id = Column(Integer, primary_key=True, index=True)
    train_no = Column(String, index=True)
    station_code = Column(String)
    date = Column(String)
    scheduled_arrival = Column(String)
    actual_arrival = Column(String)
    delay_minutes = Column(Integer)
    cause = Column(String, nullable=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
