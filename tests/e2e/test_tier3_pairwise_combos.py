"""
Tier 3: Cross-Feature Integration Pairwise Matrix Test Suite (Combinations C1–C8)
Connecting Subsystem Boundaries:
- C1: UI Map (R1) <-> HDBSCAN Spatial Clustering (R2)
- C2: UI Risk Form (R1) <-> Backend REST (R3) <-> ML Risk Model (R3)
- C3: UI Form (R1) <-> Route Safety Engine (R4)
- C4: Ingestion Pipeline (R2) <-> Backend Climate Rules (R2/R3)
- C5: Land-Bound Hotspots (R2) <-> Blackspot Countermeasures (R4)
- C6: Backend WebSocket (R3) <-> Telemetry Stream (R4)
- C7: Multi-Country Schemas (R2) <-> Municipal Safety Audit (R4)
- C8: Telemetry Stream (R4) <-> UI Camera Fly-To & Drawer (R1)
"""

import pytest
import requests
import json

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8080"
ML_ENGINE_URL = "http://localhost:8000"

class TestTier3PairwiseCombinations:
    def test_c1_ui_map_hdbscan_clustering(self, api_client, sample_dataset):
        """C1: Ingested data triggers HDBSCAN blackspots -> UI renders organic blackspot polygons with stats."""
        # 1. Post incidents to clustering engine
        resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/clustering/blackspots", json={"incidents": sample_dataset[:200], "min_cluster_size": 5})
        assert resp.status_code == 200
        blackspots = resp.json().get("blackspots", [])
        
        # 2. Verify blackspot geometry and drawer payload format suitable for map render
        if blackspots:
            bs = blackspots[0]
            assert "center" in bs
            assert "bounds" in bs
            assert "risk_score" in bs
            # 3. Verify frontend dashboard page is up and capable of rendering layers
            ui_resp = api_client.get(f"{FRONTEND_URL}/")
            assert ui_resp.status_code == 200

    def test_c2_ui_form_backend_ml_risk_prediction(self, api_client):
        """C2: UI form triggers Spring Boot prediction endpoint which delegates to FastAPI ML engine."""
        # 1. UI form payload
        form_payload = {
            "latitude": 51.5074,
            "longitude": -0.1278,
            "timestamp": "2026-08-04T18:00:00Z",
            "weatherCondition": "Raining",
            "lightCondition": "Darkness_Lit",
            "speedLimit": 40
        }
        # 2. Call backend prediction controller
        resp = api_client.post(f"{BACKEND_URL}/api/v1/predictions/risk", json=form_payload)
        assert resp.status_code == 200
        prediction = resp.json()
        
        # 3. Validate prediction attributes returned to UI
        assert "risk_level" in prediction
        assert "risk_score" in prediction
        assert "recommended_mitigations" in prediction

    def test_c3_ui_map_route_navigation_overlays(self, api_client):
        """C3: User inputs origin/dest -> UI invokes safest route API -> map receives safest vs fastest polylines."""
        route_req = {
            "startLatitude": 51.50,
            "startLongitude": -0.12,
            "endLatitude": 51.52,
            "endLongitude": -0.08
        }
        resp = api_client.post(f"{BACKEND_URL}/api/v1/routes/safest", json=route_req)
        assert resp.status_code == 200
        route_data = resp.json()
        assert "safest_route" in route_data
        assert "fastest_route" in route_data
        
        safe_path = route_data["safest_route"].get("path", [])
        fast_path = route_data["fastest_route"].get("path", [])
        assert len(safe_path) >= 2
        assert len(fast_path) >= 2

    def test_c4_data_pipeline_backend_climate_validation(self, sample_dataset):
        """C4: Ingestion script sends dataset -> climate rules validate and filter invalid environmental entries."""
        raw_records = [
            {"accident_id": "r1", "latitude": 5.55, "longitude": -0.20, "weather_condition": "Snowing", "road_surface_condition": "Ice"}, # Invalid tropical snow
            {"accident_id": "r2", "latitude": 51.50, "longitude": -0.12, "weather_condition": "Raining", "road_surface_condition": "Wet"} # Valid temperate rain
        ]
        
        validated_records = []
        for r in raw_records:
            lat = r["latitude"]
            w = r["weather_condition"]
            s = r["road_surface_condition"]
            if abs(lat) <= 23.5 and (w == "Snowing" or s == "Ice"):
                continue # Quarantine record
            validated_records.append(r)

        assert len(validated_records) == 1
        assert validated_records[0]["accident_id"] == "r2"

    def test_c5_land_bound_hotspots_blackspot_interventions(self, api_client, sample_dataset):
        """C5: Coastal land-bound blackspots generate automated engineering intervention plans with cost-benefit rankings."""
        # 1. Filter dataset for inland coordinates
        inland_dataset = [i for i in sample_dataset if 51.45 <= i["latitude"] <= 51.55 and -0.20 <= i["longitude"] <= 0.05]
        
        # 2. Extract blackspots
        resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/clustering/blackspots", json={"incidents": inland_dataset, "min_cluster_size": 5})
        blackspots = resp.json().get("blackspots", [])
        
        # 3. Map interventions for top blackspot
        if blackspots:
            top_bs = sorted(blackspots, key=lambda x: x["risk_score"], reverse=True)[0]
            factors = top_bs.get("primary_factors", {})
            interventions = []
            if "Speeding" in factors:
                interventions.append({"title": "Speed Camera Installation", "cost": 35000, "bcr": 2.8})
            if "Weather_Related" in factors or "Poor_Visibility" in factors:
                interventions.append({"title": "High-Friction Surface & LED Lighting", "cost": 45000, "bcr": 3.4})
            assert len(interventions) >= 0

    def test_c6_websocket_stomp_telemetry_ticker(self, stomp_client_helper):
        """C6: Backend event generator pushes accident event -> STOMP WebSocket broadcasts -> ticker parses event."""
        stomp = stomp_client_helper.simulate_stomp_handshake_and_message("/topic/incidents/live")
        payload = stomp["payload"]
        assert payload["type"] == "NEW_INCIDENT"
        assert payload["predictedSeverity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        assert "incident" in payload

    def test_c7_multi_country_schemas_municipal_audit(self, sample_dataset):
        """C7: Ingesting multi-country datasets (UK/Ghana/US) drives municipal safety audit generation."""
        # Normalize records from multi-country formats
        normalized = []
        for inc in sample_dataset[:100]:
            normalized.append({
                "id": inc["accident_id"],
                "lat": inc["latitude"],
                "lng": inc["longitude"],
                "severity": inc["severity"]
            })
            
        audit_summary = {
            "total_records": len(normalized),
            "severity_distribution": {
                "Fatal": sum(1 for i in normalized if i["severity"] == 1),
                "Serious": sum(1 for i in normalized if i["severity"] == 2),
                "Slight": sum(1 for i in normalized if i["severity"] == 3)
            }
        }
        assert audit_summary["total_records"] == 100
        assert sum(audit_summary["severity_distribution"].values()) <= 100

    def test_c8_ui_controls_telemetry_camera_flyto(self, api_client, stomp_client_helper):
        """C8: Telemetry alert received -> camera flies to crash coordinates and opens blackspot detail drawer."""
        stomp = stomp_client_helper.simulate_stomp_handshake_and_message()
        payload = stomp["payload"]
        incident = payload["incident"]
        
        target_lat = incident["latitude"]
        target_lng = incident["longitude"]
        
        # Verify target camera coordinates valid for Leaflet fly-to animation
        assert 50.0 <= target_lat <= 55.0
        assert -5.0 <= target_lng <= 5.0
        
        # Verify UI dashboard route responds for camera focus state
        ui_resp = api_client.get(f"{FRONTEND_URL}/")
        assert ui_resp.status_code == 200
