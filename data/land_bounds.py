"""
Land-Bound Coordinate Boundaries and Coastal Filtering
Enforces land-only incident placement (zero ocean markers for coastal cities like Accra, London, New York).
"""

from typing import Dict, Any, List, Optional, Tuple


def _coord(value: Any) -> Optional[float]:
    """
    Coerce a caller-supplied coordinate, or None when it is not a finite number.

    These records arrive from unauthenticated API callers, so a bare float()
    turns one malformed field into an unhandled 500 for the whole batch.
    """
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if parsed != parsed or parsed in (float("inf"), float("-inf")):  # NaN / inf
        return None
    return parsed

class LandBoundFilter:
    """
    Coastal Coordinate Boundary Validator
    """

    REGIONAL_LAND_BOUNDS = {
        "ACCRA": {
            "lat_min": 5.520,
            "lat_max": 5.700,
            "lng_min": -0.350,
            "lng_max": 0.050,
            "ocean_line": lambda lat, lng: lat < (5.518 + 0.04 * (lng + 0.2)) # Gulf of Guinea coastline
        },
        "LONDON": {
            "lat_min": 51.300,
            "lat_max": 51.650,
            "lng_min": -0.450,
            "lng_max": 0.200,
            "ocean_line": lambda lat, lng: (lng > 0.15 and lat < 51.45) # Thames Estuary / North Sea
        },
        "NEW_YORK": {
            "lat_min": 40.550,
            "lat_max": 40.920,
            "lng_min": -74.150,
            "lng_max": -73.700,
            "ocean_line": lambda lat, lng: (lat < 40.58 and lng > -74.05) or (lat < 40.53) # Atlantic Ocean / Lower NY Bay
        }
    }

    @classmethod
    def is_land_coordinate(cls, lat: float, lng: float, city: Optional[str] = None) -> bool:
        """
        Check if a given latitude and longitude is strictly on land.
        If city is specified, check against city-specific land bounds.
        Otherwise, auto-detect region or check global coastal boundaries.
        """
        # `city` is caller-supplied and may be any JSON type.
        city_key = city.upper().replace(" ", "_") if isinstance(city, str) else None
        if city_key and city_key in cls.REGIONAL_LAND_BOUNDS:
            bounds = cls.REGIONAL_LAND_BOUNDS[city_key]
            if not (bounds["lat_min"] <= lat <= bounds["lat_max"] and bounds["lng_min"] <= lng <= bounds["lng_max"]):
                return False
            if bounds["ocean_line"](lat, lng):
                return False
            return True

        # Auto-detect region by lat/lng bounding boxes
        # Accra region
        if 5.40 <= lat <= 5.80 and -0.50 <= lng <= 0.20:
            bounds = cls.REGIONAL_LAND_BOUNDS["ACCRA"]
            if not (bounds["lat_min"] <= lat <= bounds["lat_max"] and bounds["lng_min"] <= lng <= bounds["lng_max"]):
                return False
            return not bounds["ocean_line"](lat, lng)

        # London region
        if 51.20 <= lat <= 51.80 and -0.60 <= lng <= 0.30:
            bounds = cls.REGIONAL_LAND_BOUNDS["LONDON"]
            if not (bounds["lat_min"] <= lat <= bounds["lat_max"] and bounds["lng_min"] <= lng <= bounds["lng_max"]):
                return False
            return not bounds["ocean_line"](lat, lng)

        # New York region
        if 40.40 <= lat <= 41.00 and -74.30 <= lng <= -73.50:
            bounds = cls.REGIONAL_LAND_BOUNDS["NEW_YORK"]
            if not (bounds["lat_min"] <= lat <= bounds["lat_max"] and bounds["lng_min"] <= lng <= bounds["lng_max"]):
                return False
            return not bounds["ocean_line"](lat, lng)

        # General global land check (exclude extreme ocean lat/lng ranges)
        if lat < -60.0 or lat > 85.0:
            return False
        return True

    @classmethod
    def filter_incidents(cls, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filters out any incidents that fall into ocean markers.
        """
        valid_incidents = []
        for inc in incidents:
            lat = _coord(inc.get("latitude"))
            lng = _coord(inc.get("longitude"))
            if lat is None or lng is None:
                continue
            city = inc.get("district") or inc.get("region")
            if cls.is_land_coordinate(lat, lng, city):
                valid_incidents.append(inc)
        return valid_incidents
