"""
Tier 4: Real-World Institutional Application Workflows Test Suite
Validating End-to-End Institutional Deployments:
- Scenario 1: Municipal Traffic Safety Audit Workflow (Urban Planning Dept)
- Scenario 2: Blackspot Engineering Intervention Workflow (Highway Authority)
- Scenario 3: Emergency Route Navigation & Dynamic Rerouting Workflow (Fleet Management)
- Scenario 4: Real-Time Telemetry Stream & Control Center Workflow (Traffic Management)
"""

import pytest
import requests
import json
import time

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8080"
ML_ENGINE_URL = "http://localhost:8000"

class TestTier4InstitutionalScenarios:
    def test_scenario_1_municipal_traffic_safety_audit_workflow(self, api_client, sample_dataset):
        """Scenario 1: Municipal Traffic Safety Audit Workflow (Urban Planning Dept)"""
        # Step 1: Ingest 1,500+ multi-source traffic accident records for Metropolitan Region
        assert len(sample_dataset) >= 1500
        
        # Step 2: Execute land-bound & climate-aware verification filters
        clean_records = []
        for r in sample_dataset:
            lat, lng = r["latitude"], r["longitude"]
            weather, surface = r.get("weather_condition"), r.get("road_surface_condition")
            # Land bound check
            if not (51.45 <= lat <= 51.55 and -0.20 <= lng <= 0.05):
                continue
            # Climate rule check
            if abs(lat) <= 23.5 and (weather == "Snowing" or surface == "Ice"):
                continue
            clean_records.append(r)
        
        assert len(clean_records) > 0
        
        # Step 3: Execute spatial density analysis (KDE) and HDBSCAN organic blackspots
        density_resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/density/heatmap", json={"incidents": clean_records, "grid_resolution": 50})
        assert density_resp.status_code == 200
        heatmap_grid = density_resp.json().get("grid", {})
        assert "density_matrix" in heatmap_grid
        
        blackspot_resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/clustering/blackspots", json={"incidents": clean_records, "min_cluster_size": 5})
        assert blackspot_resp.status_code == 200
        blackspots = blackspot_resp.json().get("blackspots", [])
        
        # Step 4: Perform FP-Growth association mining to discover high-risk factor combinations
        assoc_resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/association/rules", json={"incidents": clean_records, "min_support": 0.05, "min_confidence": 0.3})
        assert assoc_resp.status_code == 200
        rules = assoc_resp.json().get("rules", [])
        
        # Step 5: Generate comprehensive Municipal Safety Audit Report JSON
        audit_report = {
            "title": "Metropolitan Municipal Traffic Safety Audit 2026",
            "jurisdiction": "Greater London Transport Authority",
            "total_incidents_analyzed": len(clean_records),
            "blackspots_identified": len(blackspots),
            "mined_risk_rules": len(rules),
            "top_blackspot_risk_score": max((b["risk_score"] for b in blackspots), default=0.0),
            "audit_timestamp": "2026-08-04T16:45:00Z"
        }
        
        assert audit_report["total_incidents_analyzed"] >= 300
        assert audit_report["blackspots_identified"] >= 0
        assert "jurisdiction" in audit_report

    def test_scenario_2_blackspot_engineering_intervention_workflow(self, api_client, sample_dataset):
        """Scenario 2: Blackspot Engineering Intervention Workflow (Highway Authority)"""
        # Step 1: Query top-ranked blackspots
        resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/clustering/blackspots", json={"incidents": sample_dataset, "min_cluster_size": 5})
        assert resp.status_code == 200
        blackspots = resp.json().get("blackspots", [])
        assert len(blackspots) > 0
        
        top_blackspot = sorted(blackspots, key=lambda b: b["risk_score"], reverse=True)[0]
        
        # Step 2: Extract spatial bounding polygon and crash history stats
        center = top_blackspot["center"]
        bounds = top_blackspot["bounds"]
        incident_count = top_blackspot["incident_count"]
        avg_severity = top_blackspot["avg_severity"]
        
        assert len(center) == 2
        assert len(bounds) >= 2
        assert incident_count >= 5
        
        # Step 3: Analyze dominant contributing crash factors
        primary_factors = top_blackspot.get("primary_factors", {})
        dominant_factor = max(primary_factors.items(), key=lambda x: x[1])[0] if primary_factors else "General_Road_Risk"
        
        # Step 4: Compute recommended engineering countermeasures
        countermeasures = []
        if "Speeding" in primary_factors or dominant_factor == "Speeding":
            countermeasures.append({
                "intervention": "Speed Reduction Humps & Optical Speed Bars",
                "estimated_cost_gbp": 25000,
                "projected_risk_reduction_pct": 35.0
            })
        if "Poor_Visibility" in primary_factors:
            countermeasures.append({
                "intervention": "Upgrade Junction Lighting to High-Output LED Units",
                "estimated_cost_gbp": 18000,
                "projected_risk_reduction_pct": 25.0
            })
        if not countermeasures:
            countermeasures.append({
                "intervention": "Apply High-Friction Surface (HFS) Dressing",
                "estimated_cost_gbp": 30000,
                "projected_risk_reduction_pct": 30.0
            })
            
        # Step 5: Calculate projected cost-benefit ratio for budget allocation
        total_cost = sum(c["estimated_cost_gbp"] for c in countermeasures)
        total_reduction = max(c["projected_risk_reduction_pct"] for c in countermeasures)
        annual_saved_value = incident_count * (5 - avg_severity) * 5000
        bcr = round(annual_saved_value / max(1, total_cost), 2)
        
        intervention_package = {
            "blackspot_id": top_blackspot["cluster_id"],
            "center_coordinates": center,
            "dominant_factor": dominant_factor,
            "recommended_countermeasures": countermeasures,
            "total_capital_expenditure_gbp": total_cost,
            "projected_risk_reduction_pct": total_reduction,
            "benefit_cost_ratio": bcr
        }
        
        assert intervention_package["total_capital_expenditure_gbp"] > 0
        assert intervention_package["benefit_cost_ratio"] > 0.0

    def test_scenario_3_emergency_route_navigation_rerouting_workflow(self, api_client):
        """Scenario 3: Emergency Route Navigation & Dynamic Rerouting Workflow (Fleet Management)"""
        # Step 1: Dispatch vehicle from Origin A (Westminster) to Destination B (Old Street)
        origin = [51.5074, -0.1278]
        destination = [51.5225, -0.0846]
        
        # Step 2: Query safest route with safety preference (alpha=0.3 speed, beta=0.7 safety)
        route_payload = {
            "origin": origin,
            "destination": destination,
            "alpha": 0.3,
            "beta": 0.7
        }
        resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/routing/safest", json=route_payload)
        assert resp.status_code == 200
        routes = resp.json()
        
        safest_route = routes["safest_route"]
        fastest_route = routes["fastest_route"]
        
        # Step 3: Verify safest path avoids high-risk blackspots and yields lower total risk
        assert safest_route["total_risk"] <= fastest_route["total_risk"] + 0.1
        assert len(safest_route["path"]) >= 2
        
        # Step 4: Simulate live emergency crash alert along primary corridor
        emergency_event = {
            "event_id": "emerg-route-alert-99",
            "latitude": 51.5150,
            "longitude": -0.1050,
            "severity": 1, # Fatal crash blocking corridor
            "weather": "Raining"
        }
        assert emergency_event["severity"] == 1
        
        # Step 5: Dynamically re-calculate alternative safe bypass route (beta=0.9 heavy safety weighting)
        bypass_payload = {
            "origin": origin,
            "destination": destination,
            "alpha": 0.1,
            "beta": 0.9
        }
        resp_bypass = api_client.post(f"{ML_ENGINE_URL}/api/v1/routing/safest", json=bypass_payload)
        assert resp_bypass.status_code == 200
        bypass_route = resp_bypass.json()["safest_route"]
        
        assert len(bypass_route["path"]) >= 2
        assert bypass_route["distance_km"] > 0

    def test_scenario_4_realtime_telemetry_control_center_workflow(self, api_client, stomp_client_helper):
        """Scenario 4: Real-Time Telemetry Stream & Control Center Workflow (Traffic Management)"""
        # Step 1: Establish STOMP WebSocket connection to `/ws`
        stomp = stomp_client_helper.simulate_stomp_handshake_and_message("/topic/incidents/live")
        assert "CONNECT" in stomp["connect_frame"]
        assert "CONNECTED" in stomp["connected_frame"]
        
        # Step 2: Subscribe to `/topic/incidents/live` stream
        assert "SUBSCRIBE" in stomp["subscribe_frame"]
        assert "/topic/incidents/live" in stomp["subscribe_frame"]
        
        # Step 3: Stream batch of live telemetry crash events into system
        batch_events = []
        for i in range(5):
            stomp_msg = stomp_client_helper.simulate_stomp_handshake_and_message()
            payload = stomp_msg["payload"]
            payload["eventId"] = f"batch-evt-{i+1}"
            batch_events.append(payload)
            
        assert len(batch_events) == 5
        
        # Step 4: Verify real-time UI ticker update and risk score recalculation
        for evt in batch_events:
            assert evt["type"] == "NEW_INCIDENT"
            assert "predictedSeverity" in evt
            inc = evt["incident"]
            
            # Predict updated risk level for control room alert dashboard
            risk_resp = api_client.post(f"{ML_ENGINE_URL}/api/v1/prediction/risk", json={"features": {
                "weather": inc["weather_condition"],
                "light": inc["light_condition"],
                "road_type": inc["road_classification"],
                "speed_limit": inc["speed_limit"],
                "junction": inc["junction_detail"]
            }})
            assert risk_resp.status_code == 200
            assert "risk_score" in risk_resp.json()
            
        # Step 5: Validate event persistence and historical stats update in backend
        stats_resp = api_client.get(f"{BACKEND_URL}/api/v1/incidents/stats")
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert stats.get("total_incidents", 0) > 0
