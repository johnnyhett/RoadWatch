"""
Climate & Land Bounds Validation Engine for ML Microservice
"""

import sys
import os
from typing import Dict, Any, List, Tuple

# Import shared or local land bounds and climate rules
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

try:
    from land_bounds import LandBoundFilter
    from climate_rules import TropicalClimateRules
except ImportError:
    # Inline fallback implementations if data module is not in path
    class LandBoundFilter:
        @classmethod
        def is_land_coordinate(cls, lat: float, lng: float, city: str = None) -> bool:
            if 5.40 <= lat <= 5.80 and -0.50 <= lng <= 0.20:
                if lat < (5.518 + 0.04 * (lng + 0.2)): return False
            elif 40.40 <= lat <= 41.00 and -74.30 <= lng <= -73.50:
                if (lat < 40.58 and lng > -74.05) or (lat < 40.53): return False
            elif 51.20 <= lat <= 51.80 and -0.60 <= lng <= 0.30:
                if lng > 0.15 and lat < 51.45: return False
            return True

    class TropicalClimateRules:
        @staticmethod
        def is_tropical_location(lat: float, lng: float) -> bool:
            return abs(lat) <= 23.5

        @classmethod
        def validate_incident_climate(cls, incident: Dict[str, Any]) -> Tuple[bool, List[str]]:
            lat = float(incident.get("latitude", 0.0))
            violations = []
            if cls.is_tropical_location(lat, 0.0):
                w = str(incident.get("weather_condition", "")).upper()
                s = str(incident.get("road_surface_condition", "")).upper()
                if any(x in w for x in ["SNOW", "ICE", "SLEET", "BLIZZARD"]):
                    violations.append(f"Prohibited tropical weather '{w}'")
                if any(x in s for x in ["SNOW", "ICE", "FROST"]):
                    violations.append(f"Prohibited tropical surface '{s}'")
            return len(violations) == 0, violations

        @classmethod
        def sanitize_incident_climate(cls, incident: Dict[str, Any]) -> Dict[str, Any]:
            san = dict(incident)
            lat = float(san.get("latitude", 0.0))
            if cls.is_tropical_location(lat, 0.0):
                w = str(san.get("weather_condition", "")).upper()
                if any(x in w for x in ["SNOW", "ICE", "SLEET", "BLIZZARD"]):
                    san["weather_condition"] = "Raining"
                s = str(san.get("road_surface_condition", "")).upper()
                if any(x in s for x in ["SNOW", "ICE", "FROST"]):
                    san["road_surface_condition"] = "Wet"
            return san

class ClimateAndLandValidator:
    """
    Service wrapper for validating and sanitizing incident batches against land boundaries & tropical climate rules.
    """

    @classmethod
    def validate_and_sanitize(cls, incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
        valid_records = []
        rejected_records = []
        violations_log = []

        for inc in incidents:
            lat = float(inc.get("latitude", 0.0))
            lng = float(inc.get("longitude", 0.0))
            city = inc.get("district") or inc.get("region")

            # 1. Land Boundary Verification
            if not LandBoundFilter.is_land_coordinate(lat, lng, city):
                rejected_records.append(inc)
                violations_log.append(f"Land boundary violation: Incident at ({lat}, {lng}) is in ocean.")
                continue

            # 2. Tropical Climate Rule Verification
            is_climate_valid, climate_errs = TropicalClimateRules.validate_incident_climate(inc)
            if not is_climate_valid:
                # Sanitize to satisfy tropical rules
                sanitized_inc = TropicalClimateRules.sanitize_incident_climate(inc)
                valid_records.append(sanitized_inc)
                violations_log.extend(climate_errs)
            else:
                valid_records.append(inc)

        return {
            "valid_count": len(valid_records),
            "rejected_count": len(rejected_records),
            "sanitized_incidents": valid_records,
            "rejected_incidents": rejected_records,
            "violations": violations_log
        }
