import json
import uuid
import random
import datetime
import math
import os
import sys

# Add data dir to sys.path if running as script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from land_bounds import LandBoundFilter
from climate_rules import TropicalClimateRules
from open_data import GhanaNRSASchema, UKStats19Schema, USFarsSchema, EUCareSchema

NUM_RECORDS = 1500

REGIONS = {
    "ACCRA": {
        "schema": "GHANA_NRSA",
        "city_name": "ACCRA",
        "lat_min": 5.530, "lat_max": 5.650,
        "lng_min": -0.300, "lng_max": -0.050,
        "hotspots": [(5.560, -0.205), (5.585, -0.170), (5.550, -0.220), (5.600, -0.185)]
    },
    "LONDON": {
        "schema": "UK_STATS19",
        "city_name": "LONDON",
        "lat_min": 51.45, "lat_max": 51.55,
        "lng_min": -0.20, "lng_max": 0.05,
        "hotspots": [(51.5074, -0.1278), (51.515, -0.09), (51.495, -0.14)]
    },
    "NEW_YORK": {
        "schema": "US_NHTSA_FARS",
        "city_name": "NEW_YORK",
        "lat_min": 40.65, "lat_max": 40.85,
        "lng_min": -74.00, "lng_max": -73.80,
        "hotspots": [(40.7589, -73.9851), (40.7128, -74.0060), (40.6782, -73.9442)]
    },
    "PARIS": {
        "schema": "EU_CARE",
        "city_name": "PARIS",
        "lat_min": 48.82, "lat_max": 48.90,
        "lng_min": 2.25, "lng_max": 2.42,
        "hotspots": [(48.8566, 2.3522), (48.8738, 2.2950)]
    }
}

def generate_timestamp():
    start_date = datetime.datetime(2023, 1, 1)
    end_date = datetime.datetime(2026, 1, 1)
    days_between = (end_date - start_date).days
    
    while True:
        r_days = random.randrange(days_between)
        r_hour = random.randrange(24)
        r_min = random.randrange(60)
        r_sec = random.randrange(60)
        
        dt = start_date + datetime.timedelta(days=r_days, hours=r_hour, minutes=r_min, seconds=r_sec)
        
        is_rush_hour = dt.hour in [7, 8, 17, 18]
        is_weekend_night = dt.weekday() in [4, 5] and (dt.hour >= 20 or dt.hour <= 3)
        
        prob = 0.2
        if is_rush_hour: prob += 0.5
        if is_weekend_night: prob += 0.4
        
        if random.random() < prob:
            return dt.isoformat()

def generate_valid_coordinate(region_key: str) -> tuple[float, float]:
    reg = REGIONS[region_key]
    max_attempts = 100
    for _ in range(max_attempts):
        if random.random() < 0.65:
            hs = random.choice(reg["hotspots"])
            lat = hs[0] + random.gauss(0, 0.006)
            lng = hs[1] + random.gauss(0, 0.006)
        else:
            lat = random.uniform(reg["lat_min"], reg["lat_max"])
            lng = random.uniform(reg["lng_min"], reg["lng_max"])
            
        lat = max(min(lat, reg["lat_max"]), reg["lat_min"])
        lng = max(min(lng, reg["lng_max"]), reg["lng_min"])

        # Enforce Coastal Land-Bound Filtering (zero ocean markers)
        if LandBoundFilter.is_land_coordinate(lat, lng, reg["city_name"]):
            return lat, lng
            
    # Fallback to guaranteed hotspot center
    hs = random.choice(reg["hotspots"])
    return hs[0], hs[1]

def generate_record(region_key: str = "LONDON"):
    reg = REGIONS[region_key]
    dt_str = generate_timestamp()
    dt = datetime.datetime.fromisoformat(dt_str)
    
    lat, lng = generate_valid_coordinate(region_key)
    
    severity = random.choices([1, 2, 3, 4], weights=[0.05, 0.15, 0.45, 0.35])[0]
    num_vehicles = random.choices([1, 2, 3, 4, 5], weights=[0.2, 0.6, 0.15, 0.04, 0.01])[0]
    
    if severity == 4:
        num_casualties = 0
    elif severity == 1:
        num_casualties = random.randint(1, 3)
    else:
        num_casualties = random.randint(1, 4)
        
    is_tropical = TropicalClimateRules.is_tropical_location(lat, lng)

    if is_tropical:
        weather = random.choices(["Clear", "Raining", "Fog", "Overcast", "Dusty/Harmattan"], weights=[0.5, 0.3, 0.05, 0.1, 0.05])[0]
        if weather == "Raining":
            road_surface = "Wet"
        else:
            road_surface = random.choices(["Dry", "Wet"], weights=[0.85, 0.15])[0]
    else:
        weather = random.choices(["Clear", "Raining", "Snowing", "Fog", "Overcast"], weights=[0.45, 0.25, 0.08, 0.05, 0.17])[0]
        if weather == "Raining":
            road_surface = "Wet"
        elif weather == "Snowing":
            road_surface = random.choices(["Snow", "Ice"], weights=[0.7, 0.3])[0]
        else:
            road_surface = random.choices(["Dry", "Wet", "Ice"], weights=[0.75, 0.20, 0.05])[0]

    is_day = 6 <= dt.hour <= 18
    if is_day:
        light = random.choices(["Daylight", "Dawn_Dusk"], weights=[0.9, 0.1])[0]
    else:
        light = random.choices(["Darkness_Lit", "Darkness_Unlit"], weights=[0.8, 0.2])[0]

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

    incident = {
        "accident_id": str(uuid.uuid4()),
        "source_schema": reg["schema"],
        "region": reg["city_name"],
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

    # Verify and sanitize climate rules
    incident = TropicalClimateRules.sanitize_incident_climate(incident)
    return incident

def main():
    records = []
    # Balance records across Ghana (Accra), UK (London), US (NYC), EU (Paris)
    region_keys = ["ACCRA", "LONDON", "NEW_YORK", "PARIS"]
    for i in range(NUM_RECORDS):
        rk = region_keys[i % len(region_keys)]
        records.append(generate_record(rk))

    # Double check all records with LandBoundFilter and TropicalClimateRules
    records = LandBoundFilter.filter_incidents(records)

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "synthetic_traffic_accidents.json")
    with open(output_path, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Generated {len(records)} authentic records at {output_path}")

if __name__ == "__main__":
    main()
