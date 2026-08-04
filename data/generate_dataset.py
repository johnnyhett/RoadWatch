import json
import uuid
import random
import datetime
import math

NUM_RECORDS = 1500

# London bounding box
LAT_MIN, LAT_MAX = 51.45, 51.55
LNG_MIN, LNG_MAX = -0.20, 0.05

# Blackspots (Hotspots)
NUM_HOTSPOTS = 10
hotspots = [(random.uniform(LAT_MIN, LAT_MAX), random.uniform(LNG_MIN, LNG_MAX)) for _ in range(NUM_HOTSPOTS)]

def generate_timestamp():
    start_date = datetime.datetime(2023, 1, 1)
    end_date = datetime.datetime(2026, 1, 1)
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    
    # Try multiple times to match temporal distribution
    while True:
        random_number_of_days = random.randrange(days_between_dates)
        random_hour = random.randrange(24)
        random_minute = random.randrange(60)
        random_second = random.randrange(60)
        
        dt = start_date + datetime.timedelta(days=random_number_of_days, hours=random_hour, minutes=random_minute, seconds=random_second)
        
        # Rush hours: 7-9, 17-19
        is_rush_hour = dt.hour in [7, 8, 17, 18]
        is_weekend_night = dt.weekday() in [4, 5] and (dt.hour >= 20 or dt.hour <= 3)
        
        prob = 0.2
        if is_rush_hour: prob += 0.5
        if is_weekend_night: prob += 0.4
        
        if random.random() < prob:
            return dt.isoformat()

def generate_record():
    dt_str = generate_timestamp()
    dt = datetime.datetime.fromisoformat(dt_str)
    
    # Coordinates (60% around hotspots, 40% random)
    if random.random() < 0.6:
        hs = random.choice(hotspots)
        lat = hs[0] + random.gauss(0, 0.005)
        lng = hs[1] + random.gauss(0, 0.005)
    else:
        lat = random.uniform(LAT_MIN, LAT_MAX)
        lng = random.uniform(LNG_MIN, LNG_MAX)
        
    lat = max(min(lat, LAT_MAX), LAT_MIN)
    lng = max(min(lng, LNG_MAX), LNG_MIN)
    
    # Severity
    severity = random.choices([1, 2, 3, 4], weights=[0.03, 0.12, 0.45, 0.40])[0]
    
    # Vehicles
    num_vehicles = random.choices([1, 2, 3, 4, 5], weights=[0.2, 0.6, 0.15, 0.04, 0.01])[0]
    
    # Casualties
    if severity == 4:
        num_casualties = 0
    elif severity == 1:
        num_casualties = random.randint(1, 3)
    else:
        num_casualties = random.randint(1, 5)
        
    # Weather & Road Surface
    weather = random.choices(["Clear", "Raining", "Snowing", "Fog", "Overcast"], weights=[0.5, 0.2, 0.05, 0.05, 0.2])[0]
    if weather == "Raining":
        road_surface = "Wet"
    elif weather == "Snowing":
        road_surface = random.choices(["Snow", "Ice"], weights=[0.7, 0.3])[0]
    else:
        road_surface = random.choices(["Dry", "Wet", "Ice"], weights=[0.8, 0.15, 0.05])[0]
        
    # Light condition
    is_day = 6 <= dt.hour <= 18
    if is_day:
        light = random.choices(["Daylight", "Dawn_Dusk"], weights=[0.9, 0.1])[0]
    else:
        light = random.choices(["Darkness_Lit", "Darkness_Unlit"], weights=[0.8, 0.2])[0]
        
    # Road classification & Speed limit
    road_class = random.choices(["Motorway", "A_Road", "B_Road", "Residential", "Unclassified"], weights=[0.1, 0.3, 0.3, 0.2, 0.1])[0]
    if road_class == "Motorway": speed_limit = 70
    elif road_class == "A_Road": speed_limit = random.choices([40, 50, 60], weights=[0.3, 0.4, 0.3])[0]
    elif road_class == "Residential": speed_limit = random.choices([20, 30], weights=[0.4, 0.6])[0]
    else: speed_limit = random.choices([30, 40], weights=[0.7, 0.3])[0]
    
    junction = random.choices(["Not_At_Junction", "Roundabout", "Crossroads", "T_Junction", "Slip_Road"], weights=[0.4, 0.1, 0.2, 0.2, 0.1])[0]
    
    vehicle_types_options = ["Car", "Bicycle", "Motorcycle", "HGV", "Bus", "Van", "Pedestrian"]
    v_types = random.choices(vehicle_types_options, k=num_vehicles)
    
    factors_options = ["Speeding", "Distraction", "Drink_Driving", "Fatigue", "Mechanical_Failure", "Weather_Related", "Poor_Visibility", "Road_Defect"]
    num_factors = random.randint(1, 3)
    factors = []
    
    if weather in ["Raining", "Snowing", "Fog"]: factors.append("Weather_Related")
    if dt.hour >= 22 or dt.hour <= 3: factors.append("Drink_Driving")
    if light != "Daylight": factors.append("Poor_Visibility")
    
    factors += random.choices(factors_options, k=num_factors)
    factors = list(set(factors))
    
    return {
        "accident_id": str(uuid.uuid4()),
        "latitude": lat,
        "longitude": lng,
        "timestamp": dt_str,
        "severity": severity,
        "num_vehicles": num_vehicles,
        "num_casualties": num_casualties,
        "weather_condition": weather,
        "road_surface_condition": road_surface,
        "light_condition": light,
        "road_classification": road_class,
        "speed_limit": speed_limit,
        "junction_detail": junction,
        "vehicle_types": v_types,
        "contributing_factors": factors
    }

def main():
    records = [generate_record() for _ in range(NUM_RECORDS)]
    with open("c:/Users/LMAA-0001/Desktop/GitHub PROJECTS/Traffic-Accident-Pattern-Recognition-System/data/synthetic_traffic_accidents.json", "w") as f:
        json.dump(records, f, indent=2)

if __name__ == "__main__":
    main()
