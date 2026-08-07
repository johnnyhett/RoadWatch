import pytest
import numpy as np
import json
import os
import sys
from fastapi.testclient import TestClient

# Ensure data and ml-engine paths are included
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from open_data import convert_to_unified, GhanaNRSASchema, UKStats19Schema, USFarsSchema, EUCareSchema
from land_bounds import LandBoundFilter
from climate_rules import TropicalClimateRules
from app.analytics.clustering import BlackspotDetector
from app.ml.climate_validate import ClimateAndLandValidator
from main import app

def test_ghana_nrsa_schema_conversion():
    raw_record = {
        "incident_ref": "GH-2026-001",
        "region": "Greater Accra",
        "district": "Accra Metropolitan",
        "latitude": 5.555,
        "longitude": -0.198,
        "accident_date": "2026-04-12",
        "accident_time": "14:30:00",
        "severity_level": "FATAL",
        "casualty_count": 2,
        "vehicles_involved": 2,
        "road_classification": "NATIONAL_HIGHWAY",
        "weather_condition": "HARMATTAN_DUST",
        "primary_cause": "SPEEDING"
    }

    unified = convert_to_unified(raw_record, "GHANA_NRSA")
    assert unified["source_schema"] == "GHANA_NRSA"
    assert unified["severity"] == 1
    assert unified["weather_condition"] == "Dusty/Harmattan"
    assert unified["num_casualties"] == 2
    assert unified["num_vehicles"] == 2

def test_uk_stats19_schema_conversion():
    raw_record = {
        "Accident_Index": "UK-2026-99",
        "Latitude": 51.5074,
        "Longitude": -0.1278,
        "Accident_Severity": 2,
        "Number_of_Vehicles": 3,
        "Number_of_Casualties": 1,
        "Date": "15/05/2026",
        "Time": "18:45",
        "Weather_Conditions": 2, # Raining
        "Road_Surface_Conditions": 2, # Wet
        "Light_Conditions": 4 # Darkness lit
    }

    unified = convert_to_unified(raw_record, "UK_STATS19")
    assert unified["source_schema"] == "UK_STATS19"
    assert unified["severity"] == 2
    assert unified["weather_condition"] == "Raining"
    assert unified["road_surface_condition"] == "Wet"
    assert unified["light_condition"] == "Darkness_Lit"

def test_us_fars_schema_conversion():
    raw_record = {
        "ST_CASE": 36001,
        "STATE": "New York",
        "COUNTY": "New York",
        "LATITUDE": 40.7128,
        "LONGITUDE": -74.0060,
        "FATALS": 1,
        "PERSONS": 4,
        "VE_FORMS": 2,
        "YEAR": 2026,
        "MONTH": 6,
        "DAY": 20,
        "HOUR": 22,
        "MINUTE": 15,
        "ATMOSPHERIC_COND": 1, # Clear
        "ROAD_SURF": 1 # Dry
    }

    unified = convert_to_unified(raw_record, "US_NHTSA_FARS")
    assert unified["source_schema"] == "US_NHTSA_FARS"
    assert unified["severity"] == 1
    assert unified["weather_condition"] == "Clear"
    assert unified["num_casualties"] == 4

def test_eu_care_schema_conversion():
    raw_record = {
        "care_id": "EU-FR-1002",
        "country_code": "FR",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "date_time": "2026-07-01T09:00:00",
        "accident_severity": "SERIOUS",
        "num_fatalities": 0,
        "num_injured": 3,
        "num_vehicles": 2,
        "weather": "RAIN",
        "road_surface": "WET"
    }

    unified = convert_to_unified(raw_record, "EU_CARE")
    assert unified["source_schema"] == "EU_CARE"
    assert unified["severity"] == 2
    assert unified["weather_condition"] == "Raining"

def test_land_bound_filtering_ocean_rejection():
    # Ocean point south of Accra coastline
    accra_ocean_lat, accra_ocean_lng = 5.480, -0.200
    assert not LandBoundFilter.is_land_coordinate(accra_ocean_lat, accra_ocean_lng, "ACCRA")

    # Land point in central Accra
    accra_land_lat, accra_land_lng = 5.580, -0.190
    assert LandBoundFilter.is_land_coordinate(accra_land_lat, accra_land_lng, "ACCRA")

    # Ocean point south of NYC
    nyc_ocean_lat, nyc_ocean_lng = 40.500, -73.900
    assert not LandBoundFilter.is_land_coordinate(nyc_ocean_lat, nyc_ocean_lng, "NEW_YORK")

    # Land point in NYC Manhattan
    nyc_land_lat, nyc_land_lng = 40.750, -73.980
    assert LandBoundFilter.is_land_coordinate(nyc_land_lat, nyc_land_lng, "NEW_YORK")

def test_tropical_climate_rules_snow_ice_prohibition():
    # Ghana / Accra coordinates (Tropical)
    tropical_lat, tropical_lng = 5.560, -0.200
    assert TropicalClimateRules.is_tropical_location(tropical_lat, tropical_lng)

    invalid_tropical_inc = {
        "latitude": tropical_lat,
        "longitude": tropical_lng,
        "weather_condition": "Snowing",
        "road_surface_condition": "Ice",
        "contributing_factors": ["Ice", "Speeding"]
    }

    is_valid, violations = TropicalClimateRules.validate_incident_climate(invalid_tropical_inc)
    assert not is_valid
    assert len(violations) >= 2

    # Test sanitization
    sanitized = TropicalClimateRules.sanitize_incident_climate(invalid_tropical_inc)
    assert sanitized["weather_condition"] != "Snowing"
    assert sanitized["road_surface_condition"] != "Ice"
    assert "Ice" not in sanitized["contributing_factors"]

def test_hdbscan_organic_6pt_convex_hull_clustering():
    detector = BlackspotDetector(min_cluster_size=5)

    # Generate 3 cluster groups around distinct centers
    np.random.seed(42)
    c1 = np.random.normal(loc=[51.50, -0.12], scale=0.002, size=(15, 2))
    c2 = np.random.normal(loc=[51.53, -0.08], scale=0.003, size=(20, 2))
    c3 = np.random.normal(loc=[51.48, -0.15], scale=0.001, size=(10, 2))
    
    all_coords = np.vstack([c1, c2, c3])
    incidents = []
    for lat, lng in all_coords:
        incidents.append({
            "latitude": float(lat),
            "longitude": float(lng),
            "severity": 2,
            "contributing_factors": ["Speeding"]
        })

    res = detector.detect(incidents, min_cluster_size=5)
    blackspots = res.get("blackspots", [])

    assert len(blackspots) >= 2
    for bs in blackspots:
        bounds = bs.get("bounds", [])
        # REQUIREMENT 4: Must return EXACTLY 6 boundary vertices representing blackspot perimeter
        assert len(bounds) == 6, f"Blackspot bounds must have exactly 6 vertices, got {len(bounds)}"
        assert "center" in bs
        assert "risk_score" in bs

def test_climate_and_land_validator_service():
    test_batch = [
        {"latitude": 5.580, "longitude": -0.190, "district": "Accra", "weather_condition": "Clear"}, # Valid land
        {"latitude": 5.450, "longitude": -0.200, "district": "Accra", "weather_condition": "Clear"}, # Ocean (Rejected)
        {"latitude": 5.600, "longitude": -0.180, "district": "Accra", "weather_condition": "Snowing", "road_surface_condition": "Ice"} # Tropical climate violation (Sanitized)
    ]

    res = ClimateAndLandValidator.validate_and_sanitize(test_batch)
    assert res["rejected_count"] == 1
    assert res["valid_count"] == 2
    sanitized_items = res["sanitized_incidents"]
    assert sanitized_items[1]["weather_condition"] != "Snowing"

def test_fastapi_m2_endpoints():
    client = TestClient(app)

    # 1. Test /api/v1/ml/climate-validate
    res = client.post("/api/v1/ml/climate-validate", json={
        "incidents": [
            {"latitude": 5.560, "longitude": -0.200, "weather_condition": "Snowing", "road_surface_condition": "Ice"}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid_count"] == 1
    assert data["sanitized_incidents"][0]["weather_condition"] == "Raining"

    # 2. Test /api/v1/ml/cluster
    np.random.seed(42)
    c1 = np.random.normal(loc=[5.560, -0.200], scale=0.001, size=(12, 2))
    incidents = [{"latitude": float(x[0]), "longitude": float(x[1]), "severity": 2} for x in c1]
    res_cluster = client.post("/api/v1/ml/cluster", json={
        "incidents": incidents,
        "min_cluster_size": 5
    })
    assert res_cluster.status_code == 200
    bs_data = res_cluster.json()
    assert "blackspots" in bs_data
    if len(bs_data["blackspots"]) > 0:
        bounds = bs_data["blackspots"][0]["bounds"]
        assert len(bounds) == 6


# ---------------------------------------------------------------------------
# Hardening: input bounds and error handling on the unauthenticated endpoints
# ---------------------------------------------------------------------------

class TestEndpointHardening:
    """Bounds and error handling on the unauthenticated analytical endpoints."""

    @pytest.fixture(autouse=True)
    def _client(self):
        self.client = TestClient(app)

    def test_oversized_incident_payload_is_rejected(self):
        import main
        big = [{"latitude": 5.6, "longitude": -0.2, "severity": 3}] * (main.MAX_INCIDENTS_PER_REQUEST + 1)
        resp = self.client.post("/api/v1/clustering/blackspots", json={"incidents": big, "min_cluster_size": 5})
        assert resp.status_code == 413

    def test_training_batch_is_bounded(self):
        import main
        big = [{"latitude": 5.6, "longitude": -0.2, "severity": 3}] * (main.MAX_TRAINING_RECORDS_PER_REQUEST + 1)
        resp = self.client.post("/api/v1/ml/train", json={"records": big})
        assert resp.status_code == 413

    def test_out_of_range_coordinates_are_rejected(self):
        resp = self.client.post(
            "/api/v1/routing/safest",
            json={"origin": [999.0, -1.6], "destination": [6.7, -1.6]},
        )
        assert resp.status_code == 422

    def test_grid_resolution_is_clamped(self):
        # An unbounded resolution lets a caller request a resolution^2 matrix.
        resp = self.client.post(
            "/api/v1/density/heatmap",
            json={"incidents": [{"latitude": 5.6 + i * 0.001, "longitude": -0.2, "severity": 3} for i in range(20)],
                  "grid_resolution": 100000},
        )
        assert resp.status_code == 200
        assert len(resp.json()["grid"]["density_matrix"]) <= 500

    def test_cors_allow_list_excludes_unknown_origins(self):
        allowed = self.client.get("/api/v1/temporal/patterns", headers={"Origin": "http://localhost:3000"})
        assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"

        blocked = self.client.get("/api/v1/temporal/patterns", headers={"Origin": "https://evil.example.com"})
        assert "access-control-allow-origin" not in blocked.headers

    def test_prediction_failure_does_not_leak_internals(self):
        resp = self.client.post("/api/v1/prediction/risk", json={"features": {"speed_limit": "not-a-number"}})
        assert resp.status_code in (200, 422)
        body = resp.json()
        # Whichever path it takes, no raw exception text should reach the self.client.
        assert "Traceback" not in str(body)
        assert "site-packages" not in str(body)
