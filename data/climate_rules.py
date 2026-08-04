"""
Tropical Climate Rules Engine
Enforces climate rules prohibiting unrealistic 'Snow' or 'Ice' weather/road factors for tropical/African locations (e.g., Ghana/Accra coordinates).
"""

from typing import Dict, Any, List, Tuple

PROHIBITED_TROPICAL_WEATHER = {"SNOW", "SNOWING", "BLIZZARD", "SLEET", "FREEZING_RAIN", "ICE"}
PROHIBITED_TROPICAL_SURFACE = {"SNOW", "ICE", "FROST", "SNOW/ICE", "SLUSH"}
PROHIBITED_TROPICAL_FACTORS = {"SNOW", "ICE", "BLACK_ICE", "FREEZING_RAIN", "SNOWSTORM"}

class TropicalClimateRules:
    """
    Climate Rules Enforcement Engine
    """

    @staticmethod
    def is_tropical_location(lat: float, lng: float) -> bool:
        """
        Check if a location is tropical.
        Ghana / Accra coordinates (lat 4.5°N - 11.5°N) fall within absolute latitude <= 23.5° (Tropics).
        """
        return abs(lat) <= 23.5

    @classmethod
    def validate_incident_climate(cls, incident: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate whether an incident violates tropical climate rules.
        Returns (is_valid, list_of_violations).
        """
        lat = float(incident.get("latitude", 0.0))
        lng = float(incident.get("longitude", 0.0))
        violations = []

        if cls.is_tropical_location(lat, lng):
            weather = str(incident.get("weather_condition", "")).upper()
            surface = str(incident.get("road_surface_condition", "")).upper()
            factors = [str(f).upper() for f in incident.get("contributing_factors", [])]

            if any(pw in weather for pw in PROHIBITED_TROPICAL_WEATHER):
                violations.append(f"Prohibited tropical weather condition: '{incident.get('weather_condition')}' at lat {lat}")
            
            if any(ps in surface for ps in PROHIBITED_TROPICAL_SURFACE):
                violations.append(f"Prohibited tropical road surface condition: '{incident.get('road_surface_condition')}' at lat {lat}")

            for f in factors:
                if any(pf in f for pf in PROHIBITED_TROPICAL_FACTORS):
                    violations.append(f"Prohibited tropical contributing factor: '{f}' at lat {lat}")

        return (len(violations) == 0, violations)

    @classmethod
    def sanitize_incident_climate(cls, incident: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes an incident record to guarantee tropical compliance.
        If tropical, converts any Snow/Ice entries into valid tropical alternatives.
        """
        lat = float(incident.get("latitude", 0.0))
        lng = float(incident.get("longitude", 0.0))

        if not cls.is_tropical_location(lat, lng):
            return incident

        sanitized = dict(incident)
        weather = str(sanitized.get("weather_condition", "")).upper()
        if any(pw in weather for pw in PROHIBITED_TROPICAL_WEATHER):
            sanitized["weather_condition"] = "Raining"

        surface = str(sanitized.get("road_surface_condition", "")).upper()
        if any(ps in surface for ps in PROHIBITED_TROPICAL_SURFACE):
            sanitized["road_surface_condition"] = "Wet"

        factors = list(sanitized.get("contributing_factors", []))
        new_factors = []
        for f in factors:
            f_upper = str(f).upper()
            if any(pf in f_upper for pf in PROHIBITED_TROPICAL_FACTORS):
                new_factors.append("Weather_Related")
            else:
                new_factors.append(f)
        sanitized["contributing_factors"] = list(set(new_factors))

        return sanitized
