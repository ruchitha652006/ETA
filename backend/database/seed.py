from database.db import SessionLocal, init_db, Train, Station, Schedule, LiveStatus, DelayHistory
from datetime import datetime, timedelta
import random


def seed_database():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(DelayHistory).delete()
        db.query(LiveStatus).delete()
        db.query(Schedule).delete()
        db.query(Station).delete()
        db.query(Train).delete()
        db.commit()

        # --- STATIONS ---
        stations_data = [
            {"code": "HYB", "name": "Hyderabad", "zone": "SCR", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
            {"code": "KZJ", "name": "Kazipet", "zone": "SCR", "state": "Telangana", "lat": 17.9750, "lon": 79.5100},
            {"code": "WL",  "name": "Warangal", "zone": "SCR", "state": "Telangana", "lat": 17.9689, "lon": 79.5941},
            {"code": "MB",  "name": "Mahabubabad", "zone": "SCR", "state": "Telangana", "lat": 17.6034, "lon": 80.0000},
            {"code": "BZA", "name": "Vijayawada", "zone": "SCR", "state": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480},
            {"code": "NLR", "name": "Nellore", "zone": "SCR", "state": "Andhra Pradesh", "lat": 14.4426, "lon": 79.9865},
            {"code": "MAS", "name": "Chennai Central", "zone": "SR", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
            {"code": "SC",  "name": "Secunderabad", "zone": "SCR", "state": "Telangana", "lat": 17.4344, "lon": 78.5013},
            {"code": "NDLS","name": "New Delhi", "zone": "NR", "state": "Delhi", "lat": 28.6448, "lon": 77.2167},
            {"code": "BCT", "name": "Mumbai Central", "zone": "WR", "state": "Maharashtra", "lat": 18.9711, "lon": 72.8195},
            {"code": "GNT", "name": "Guntur", "zone": "SCR", "state": "Andhra Pradesh", "lat": 16.3004, "lon": 80.4428},
            {"code": "OGL", "name": "Ongole", "zone": "SCR", "state": "Andhra Pradesh", "lat": 15.5057, "lon": 80.0499},
        ]
        station_objs = []
        for s in stations_data:
            st = Station(station_code=s["code"], station_name=s["name"], zone=s["zone"],
                         state=s["state"], latitude=s["lat"], longitude=s["lon"])
            db.add(st)
            station_objs.append(st)

        # --- TRAINS ---
        trains_data = [
            {"no": "12723", "name": "Telangana Express", "from": "Hyderabad", "from_code": "HYB",
             "to": "Vijayawada", "to_code": "BZA", "type": "Superfast Express"},
            {"no": "12724", "name": "Telangana Express (Return)", "from": "Nellore", "from_code": "NLR",
             "to": "Hyderabad", "to_code": "HYB", "type": "Superfast Express"},
            {"no": "12649", "name": "Karnataka Sampark Kranti", "from": "New Delhi", "from_code": "NDLS",
             "to": "Vijayawada", "to_code": "BZA", "type": "Superfast Express"},
            {"no": "17201", "name": "Golconda Express", "from": "Secunderabad", "from_code": "SC",
             "to": "Chennai Central", "to_code": "MAS", "type": "Express"},
            {"no": "12759", "name": "Charminar Express", "from": "Hyderabad", "from_code": "HYB",
             "to": "Chennai Central", "to_code": "MAS", "type": "Superfast Express"},
        ]
        train_objs = {}
        for t in trains_data:
            tr = Train(train_no=t["no"], train_name=t["name"], from_station=t["from"],
                       from_code=t["from_code"], to_station=t["to"], to_code=t["to_code"],
                       train_type=t["type"])
            db.add(tr)
            db.flush()
            train_objs[t["no"]] = tr

        # --- SCHEDULES for 12723 Telangana Express ---
        schedule_12723 = [
            {"code": "HYB", "name": "Hyderabad", "arr": "Starts", "dep": "08:00", "stop": 1, "dist": 0, "halt": 0},
            {"code": "KZJ", "name": "Kazipet", "arr": "10:24", "dep": "10:27", "stop": 2, "dist": 148, "halt": 3},
            {"code": "WL",  "name": "Warangal", "arr": "11:00", "dep": "11:05", "stop": 3, "dist": 157, "halt": 5},
            {"code": "MB",  "name": "Mahabubabad", "arr": "12:15", "dep": "12:17", "stop": 4, "dist": 213, "halt": 2},
            {"code": "BZA", "name": "Vijayawada", "arr": "02:10", "dep": "02:20", "stop": 5, "dist": 430, "halt": 10},
            {"code": "GNT", "name": "Guntur", "arr": "03:15", "dep": "03:20", "stop": 6, "dist": 459, "halt": 5},
            {"code": "OGL", "name": "Ongole", "arr": "04:30", "dep": "04:32", "stop": 7, "dist": 555, "halt": 2},
            {"code": "NLR", "name": "Nellore", "arr": "05:30", "dep": "05:35", "stop": 8, "dist": 626, "halt": 5},
        ]
        for s in schedule_12723:
            sch = Schedule(train_id=train_objs["12723"].id, station_code=s["code"],
                           station_name=s["name"], arrival_time=s["arr"], departure_time=s["dep"],
                           stop_number=s["stop"], distance_from_origin=s["dist"], avg_halt_minutes=s["halt"])
            db.add(sch)

        # --- SCHEDULES for 12759 Charminar ---
        schedule_12759 = [
            {"code": "HYB", "name": "Hyderabad", "arr": "Starts", "dep": "15:30", "stop": 1, "dist": 0, "halt": 0},
            {"code": "SC",  "name": "Secunderabad", "arr": "15:45", "dep": "15:50", "stop": 2, "dist": 5, "halt": 5},
            {"code": "KZJ", "name": "Kazipet", "arr": "17:45", "dep": "17:48", "stop": 3, "dist": 148, "halt": 3},
            {"code": "WL",  "name": "Warangal", "arr": "18:10", "dep": "18:15", "stop": 4, "dist": 157, "halt": 5},
            {"code": "BZA", "name": "Vijayawada", "arr": "21:00", "dep": "21:15", "stop": 5, "dist": 430, "halt": 15},
            {"code": "NLR", "name": "Nellore", "arr": "23:45", "dep": "23:50", "stop": 6, "dist": 626, "halt": 5},
            {"code": "MAS", "name": "Chennai Central", "arr": "04:00", "dep": "Ends", "stop": 7, "dist": 793, "halt": 0},
        ]
        for s in schedule_12759:
            sch = Schedule(train_id=train_objs["12759"].id, station_code=s["code"],
                           station_name=s["name"], arrival_time=s["arr"], departure_time=s["dep"],
                           stop_number=s["stop"], distance_from_origin=s["dist"], avg_halt_minutes=s["halt"])
            db.add(sch)

        # Minimal schedules for other trains
        schedule_17201 = [
            {"code": "SC",  "name": "Secunderabad", "arr": "Starts", "dep": "06:00", "stop": 1, "dist": 0, "halt": 0},
            {"code": "KZJ", "name": "Kazipet", "arr": "08:10", "dep": "08:13", "stop": 2, "dist": 145, "halt": 3},
            {"code": "BZA", "name": "Vijayawada", "arr": "11:30", "dep": "11:45", "stop": 3, "dist": 428, "halt": 15},
            {"code": "NLR", "name": "Nellore", "arr": "14:30", "dep": "14:32", "stop": 4, "dist": 623, "halt": 2},
            {"code": "MAS", "name": "Chennai Central", "arr": "19:30", "dep": "Ends", "stop": 5, "dist": 791, "halt": 0},
        ]
        for s in schedule_17201:
            sch = Schedule(train_id=train_objs["17201"].id, station_code=s["code"],
                           station_name=s["name"], arrival_time=s["arr"], departure_time=s["dep"],
                           stop_number=s["stop"], distance_from_origin=s["dist"], avg_halt_minutes=s["halt"])
            db.add(sch)

        # --- LIVE STATUS ---
        now_str = datetime.now().strftime("%I:%M %p")
        live_statuses = [
            {"train_id": train_objs["12723"].id, "cur_code": "HYB", "cur_name": "Hyderabad",
             "delay": 18, "speed": 62.0, "dist_next": 148, "status": "Running",
             "congestion": 0.35, "weather": 0.1, "speed_restriction": False},
            {"train_id": train_objs["12759"].id, "cur_code": "KZJ", "cur_name": "Kazipet",
             "delay": 5, "speed": 85.0, "dist_next": 9, "status": "Running",
             "congestion": 0.15, "weather": 0.0, "speed_restriction": False},
            {"train_id": train_objs["17201"].id, "cur_code": "BZA", "cur_name": "Vijayawada",
             "delay": 32, "speed": 0.0, "dist_next": 195, "status": "Halted",
             "congestion": 0.6, "weather": 0.25, "speed_restriction": True},
        ]
        for ls in live_statuses:
            live = LiveStatus(train_id=ls["train_id"], current_station_code=ls["cur_code"],
                              current_station_name=ls["cur_name"], current_delay_minutes=ls["delay"],
                              current_speed_kmh=ls["speed"], distance_to_next_station=ls["dist_next"],
                              status=ls["status"], last_updated=now_str,
                              track_congestion=ls["congestion"], weather_factor=ls["weather"],
                              speed_restriction=ls["speed_restriction"])
            db.add(live)

        # --- DELAY HISTORY ---
        history_entries = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            base_delay = random.randint(5, 35)
            history_entries.extend([
                {"train_no": "12723", "station": "HYB", "date": date, "sched": "08:00", "actual_delay": random.randint(0, 10)},
                {"train_no": "12723", "station": "KZJ", "date": date, "sched": "10:24", "actual_delay": base_delay + random.randint(-5, 5)},
                {"train_no": "12723", "station": "WL",  "date": date, "sched": "11:00", "actual_delay": base_delay + random.randint(-3, 8)},
                {"train_no": "12723", "station": "MB",  "date": date, "sched": "12:15", "actual_delay": base_delay + random.randint(-2, 10)},
                {"train_no": "12723", "station": "BZA", "date": date, "sched": "02:10", "actual_delay": base_delay + random.randint(0, 15)},
                {"train_no": "12723", "station": "NLR", "date": date, "sched": "05:30", "actual_delay": base_delay + random.randint(2, 20)},
            ])
        for h in history_entries:
            causes = ["Signal failure", "Track maintenance", "Late running", "Crew change", "Technical issue", None]
            dh = DelayHistory(train_no=h["train_no"], station_code=h["station"],
                              date=h["date"], scheduled_arrival=h["sched"],
                              actual_arrival=h["sched"], delay_minutes=max(0, h["actual_delay"]),
                              cause=random.choice(causes))
            db.add(dh)

        db.commit()
        print("✅ Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_database()
