"""
Open Data Schemas and Ingestion Pipeline
Supports authentic schemas for:
- Ghana NRSA (National Road Safety Authority)
- UK DfT STATS19
- US NHTSA FARS (Fatality Analysis Reporting System)
- EU CARE (Community database on Road Accidents in Europe)
"""

from typing import Dict, Any, List, Optional
import datetime
import uuid

class BaseSchemaConverter:
    @staticmethod
    def normalize_severity(raw_severity: Any) -> int:
        """
        Normalized severity rating:
        1: Fatal / Critical
        2: Severe / Serious
        3: Moderate / Minor / Slight
        4: Property Damage Only (PDO)
        """
        return 3

class GhanaNRSASchema(BaseSchemaConverter):
    """
    Ghana NRSA (National Road Safety Authority) Schema Transformer
    Fields:
    - incident_ref / accident_id
    - region (e.g., Greater Accra, Ashanti, Western)
    - district
    - location_name
    - latitude, longitude
    - accident_date, accident_time
    - severity_level ("FATAL", "SERIOUS", "SLIGHT")
    - casualty_count
    - vehicles_involved
    - road_classification ("NATIONAL_HIGHWAY", "REGIONAL_ROAD", "URBAN_STREET")
    - weather_condition ("CLEAR", "RAINING", "HARMATTAN_DUST", "FOG")
    - primary_cause ("SPEEDING", "OVERTAKING", "FATIGUE", "MECHANICAL")
    """

    @classmethod
    def to_unified(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        sev_map = {
            "FATAL": 1,
            "SERIOUS": 2,
            "SLIGHT": 3,
            "PROPERTY_DAMAGE": 4
        }
        raw_sev = str(record.get("severity_level", "SLIGHT")).upper()
        severity = sev_map.get(raw_sev, 3)

        dt_str = record.get("timestamp")
        if not dt_str:
            date_part = record.get("accident_date", "2024-01-01")
            time_part = record.get("accident_time", "12:00:00")
            dt_str = f"{date_part}T{time_part}"

        # Weather mapping (prohibits Snow/Ice for Ghana)
        raw_weather = str(record.get("weather_condition", "CLEAR")).upper()
        weather = "Clear"
        if "RAIN" in raw_weather:
            weather = "Raining"
        elif "HARMATTAN" in raw_weather or "DUST" in raw_weather:
            weather = "Dusty/Harmattan"
        elif "FOG" in raw_weather:
            weather = "Fog"

        road_surf = "Wet" if weather == "Raining" else "Dry"

        return {
            "accident_id": str(record.get("incident_ref", uuid.uuid4())),
            "source_schema": "GHANA_NRSA",
            "region": record.get("region", "Greater Accra"),
            "district": record.get("district", "Accra Metropolitan"),
            "latitude": float(record.get("latitude", 5.55)),
            "longitude": float(record.get("longitude", -0.20)),
            "timestamp": dt_str,
            "severity": severity,
            "num_vehicles": int(record.get("vehicles_involved", 1)),
            "num_casualties": int(record.get("casualty_count", 0)),
            "weather_condition": weather,
            "road_surface_condition": road_surf,
            "light_condition": record.get("light_condition", "Daylight"),
            "road_classification": record.get("road_classification", "Urban_Street"),
            "speed_limit": int(record.get("speed_limit", 50)),
            "junction_detail": record.get("junction_detail", "T_Junction"),
            "vehicle_types": record.get("vehicle_types", ["Car", "Minibus/Trotro"]),
            "contributing_factors": [record.get("primary_cause", "Speeding")]
        }

class UKStats19Schema(BaseSchemaConverter):
    """
    UK DfT STATS19 Schema Transformer
    Fields:
    - Accident_Index
    - Location_Easting_OSGR, Location_Northing_OSGR, Longitude, Latitude
    - Accident_Severity (1: Fatal, 2: Serious, 3: Slight)
    - Number_of_Vehicles, Number_of_Casualties
    - Date, Time
    - Speed_limit
    - Light_Conditions (1: Daylight, 4: Darkness - lights lit, 6: Darkness - no lighting)
    - Weather_Conditions (1: Fine no high winds, 2: Raining no high winds, 3: Snowing, 5: Fog)
    - Road_Surface_Conditions (1: Dry, 2: Wet or damp, 3: Snow, 4: Frost or ice)
    """

    @classmethod
    def to_unified(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        sev_val = int(record.get("Accident_Severity", 3))
        severity = min(max(sev_val, 1), 3)

        date_str = record.get("Date", "2024-01-01")
        time_str = record.get("Time", "12:00")
        try:
            if "/" in date_str:
                parts = date_str.split("/")
                iso_date = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            else:
                iso_date = date_str
            dt_str = f"{iso_date}T{time_str}:00"
        except Exception:
            dt_str = "2024-01-01T12:00:00"

        w_code = int(record.get("Weather_Conditions", 1))
        weather_map = {1: "Clear", 2: "Raining", 3: "Snowing", 4: "Raining", 5: "Fog", 6: "Overcast"}
        weather = weather_map.get(w_code, "Clear")

        s_code = int(record.get("Road_Surface_Conditions", 1))
        surface_map = {1: "Dry", 2: "Wet", 3: "Snow", 4: "Ice", 5: "Flood"}
        road_surf = surface_map.get(s_code, "Dry")

        l_code = int(record.get("Light_Conditions", 1))
        light_map = {1: "Daylight", 4: "Darkness_Lit", 5: "Darkness_Unlit", 6: "Darkness_Unlit", 7: "Dawn_Dusk"}
        light = light_map.get(l_code, "Daylight")

        return {
            "accident_id": str(record.get("Accident_Index", uuid.uuid4())),
            "source_schema": "UK_STATS19",
            "region": record.get("Local_Authority_District", "Greater London"),
            "district": record.get("Local_Authority_District", "London"),
            "latitude": float(record.get("Latitude", 51.50)),
            "longitude": float(record.get("Longitude", -0.12)),
            "timestamp": dt_str,
            "severity": severity,
            "num_vehicles": int(record.get("Number_of_Vehicles", 1)),
            "num_casualties": int(record.get("Number_of_Casualties", 0)),
            "weather_condition": weather,
            "road_surface_condition": road_surf,
            "light_condition": light,
            "road_classification": record.get("1st_Road_Class", "A_Road"),
            "speed_limit": int(record.get("Speed_limit", 30)),
            "junction_detail": record.get("Junction_Detail", "Crossroads"),
            "vehicle_types": record.get("vehicle_types", ["Car"]),
            "contributing_factors": record.get("contributing_factors", ["Speeding"])
        }

class USFarsSchema(BaseSchemaConverter):
    """
    US NHTSA FARS Schema Transformer
    Fields:
    - ST_CASE / case_id
    - STATE, COUNTY, CITY
    - FATALS, PERSONS, VE_FORMS
    - YEAR, MONTH, DAY, HOUR, MINUTE
    - LATITUDE, LONGITUDE
    - ATMOSPHERIC_COND (1: Clear, 2: Rain, 3: Sleet, 4: Snow, 5: Fog)
    - LGT_COND (1: Daylight, 2: Dark - Not Lighted, 3: Dark - Lighted)
    - ROAD_SURF (1: Dry, 2: Wet, 3: Snow, 4: Ice)
    """

    @classmethod
    def to_unified(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        fatals = int(record.get("FATALS", 1))
        severity = 1 if fatals > 0 else 2

        yr = int(record.get("YEAR", 2024))
        mo = int(record.get("MONTH", 1))
        dy = int(record.get("DAY", 1))
        hr = int(record.get("HOUR", 12))
        mn = int(record.get("MINUTE", 0))
        dt_str = f"{yr:04d}-{mo:02d}-{dy:02d}T{hr:02d}:{mn:02d}:00"

        w_code = int(record.get("ATMOSPHERIC_COND", 1))
        weather_map = {1: "Clear", 2: "Raining", 3: "Sleet", 4: "Snowing", 5: "Fog", 10: "Overcast"}
        weather = weather_map.get(w_code, "Clear")

        s_code = int(record.get("ROAD_SURF", 1))
        surface_map = {1: "Dry", 2: "Wet", 3: "Snow", 4: "Ice"}
        road_surf = surface_map.get(s_code, "Dry")

        l_code = int(record.get("LGT_COND", 1))
        light_map = {1: "Daylight", 2: "Darkness_Unlit", 3: "Darkness_Lit", 5: "Dawn_Dusk", 6: "Dawn_Dusk"}
        light = light_map.get(l_code, "Daylight")

        return {
            "accident_id": str(record.get("ST_CASE", uuid.uuid4())),
            "source_schema": "US_NHTSA_FARS",
            "region": str(record.get("STATE", "New York")),
            "district": str(record.get("COUNTY", "New York County")),
            "latitude": float(record.get("LATITUDE", 40.71)),
            "longitude": float(record.get("LONGITUDE", -74.00)),
            "timestamp": dt_str,
            "severity": severity,
            "num_vehicles": int(record.get("VE_FORMS", 1)),
            "num_casualties": int(record.get("PERSONS", 1)),
            "weather_condition": weather,
            "road_surface_condition": road_surf,
            "light_condition": light,
            "road_classification": "Interstate",
            "speed_limit": int(record.get("SPEED_LIMIT", 55)),
            "junction_detail": "Not_At_Junction",
            "vehicle_types": ["Car", "SUV"],
            "contributing_factors": ["Speeding", "Distraction"]
        }

class EUCareSchema(BaseSchemaConverter):
    """
    EU CARE Schema Transformer
    Fields:
    - care_id
    - country_code (e.g. DE, FR, ES, IT)
    - latitude, longitude
    - date_time
    - accident_severity ("FATAL", "SERIOUS", "MINOR")
    - num_fatalities, num_injured, num_vehicles
    - weather ("CLEAR", "RAIN", "SNOW", "FOG")
    - road_surface ("DRY", "WET", "ICE", "SNOW")
    - lighting ("DAY", "NIGHT_LIT", "NIGHT_UNLIT")
    """

    @classmethod
    def to_unified(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        sev_map = {"FATAL": 1, "SERIOUS": 2, "MINOR": 3, "PDO": 4}
        raw_sev = str(record.get("accident_severity", "MINOR")).upper()
        severity = sev_map.get(raw_sev, 3)

        dt_str = record.get("date_time", "2024-01-01T12:00:00")

        w_raw = str(record.get("weather", "CLEAR")).upper()
        weather = "Clear"
        if "RAIN" in w_raw: weather = "Raining"
        elif "SNOW" in w_raw: weather = "Snowing"
        elif "FOG" in w_raw: weather = "Fog"

        s_raw = str(record.get("road_surface", "DRY")).upper()
        surface = "Dry"
        if "WET" in s_raw: surface = "Wet"
        elif "ICE" in s_raw: surface = "Ice"
        elif "SNOW" in s_raw: surface = "Snow"

        l_raw = str(record.get("lighting", "DAY")).upper()
        light = "Daylight"
        if "NIGHT_LIT" in l_raw: light = "Darkness_Lit"
        elif "NIGHT" in l_raw: light = "Darkness_Unlit"

        return {
            "accident_id": str(record.get("care_id", uuid.uuid4())),
            "source_schema": "EU_CARE",
            "region": record.get("country_code", "FR"),
            "district": record.get("district", "Paris Region"),
            "latitude": float(record.get("latitude", 48.85)),
            "longitude": float(record.get("longitude", 2.35)),
            "timestamp": dt_str,
            "severity": severity,
            "num_vehicles": int(record.get("num_vehicles", 1)),
            "num_casualties": int(record.get("num_fatalities", 0)) + int(record.get("num_injured", 0)),
            "weather_condition": weather,
            "road_surface_condition": surface,
            "light_condition": light,
            "road_classification": record.get("road_class", "Urban_Road"),
            "speed_limit": int(record.get("speed_limit", 50)),
            "junction_detail": "Roundabout",
            "vehicle_types": ["Car"],
            "contributing_factors": ["Distraction"]
        }

def convert_to_unified(record: Dict[str, Any], schema_type: str) -> Dict[str, Any]:
    """
    Ingest a record from one of the authentic schemas and return a unified Incident dict.
    schema_type: "GHANA_NRSA" | "UK_STATS19" | "US_NHTSA_FARS" | "EU_CARE"
    """
    schema_type_upper = schema_type.upper().replace("-", "_").replace(" ", "_")
    if "GHANA" in schema_type_upper or "NRSA" in schema_type_upper:
        return GhanaNRSASchema.to_unified(record)
    elif "UK" in schema_type_upper or "STATS19" in schema_type_upper:
        return UKStats19Schema.to_unified(record)
    elif "US" in schema_type_upper or "FARS" in schema_type_upper or "NHTSA" in schema_type_upper:
        return USFarsSchema.to_unified(record)
    elif "EU" in schema_type_upper or "CARE" in schema_type_upper:
        return EUCareSchema.to_unified(record)
    else:
        return record
