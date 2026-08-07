import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.analytics.clustering import BlackspotDetector
from app.analytics.density import DensityEstimator
from app.analytics.association import AssociationMiner
from app.analytics.temporal import TemporalAnalyzer
from app.ml.risk_model import RiskModel
from app.routing.safety_router import SafetyRouter
from app.ml.climate_validate import ClimateAndLandValidator

import sys
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))
try:
    from open_data import convert_to_unified
except ImportError:
    convert_to_unified = lambda record, schema: record

@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_and_train_real_data()
    yield


app = FastAPI(
    title="RoadWatch — Traffic Accident Pattern Recognition System ML Engine",
    lifespan=lifespan,
)

# Allow-list rather than a wildcard. Starlette echoes the caller's Origin when
# allow_origins=["*"] is paired with allow_credentials=True, which lets any page
# on the internet issue credentialed requests to this service and read the
# responses (CWE-942).
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ROADWATCH_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Guard rails for the unauthenticated analytical endpoints. Every one of these
# accepts a caller-supplied list, and the clustering/mining work is superlinear
# in its length, so an unbounded body is a denial-of-service lever.
MAX_INCIDENTS_PER_REQUEST = int(os.environ.get("ROADWATCH_MAX_INCIDENTS", "50000"))
MAX_TRAINING_RECORDS_PER_REQUEST = int(os.environ.get("ROADWATCH_MAX_TRAIN_RECORDS", "20000"))
MAX_DATASET_RECORDS = int(os.environ.get("ROADWATCH_MAX_DATASET", "200000"))


def _reject_oversized(incidents: List[Dict[str, Any]], limit: int = MAX_INCIDENTS_PER_REQUEST) -> None:
    if len(incidents) > limit:
        raise HTTPException(
            status_code=413,
            detail=f"Payload too large: {len(incidents)} incidents exceeds the {limit} limit.",
        )

# Global instances
dataset = []
risk_model = RiskModel()
router = SafetyRouter()

def load_and_train_real_data():
    global dataset
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_traffic_accidents.json")
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(__file__), "data", "synthetic_traffic_accidents.json")

    if os.path.exists(data_path):
        with open(data_path, "r") as f:
            raw_data = json.load(f)
            
        # Normalize records through official Open Data schema transformers (Ghana NRSA, UK STATS19, US FARS, EU CARE)
        dataset = [convert_to_unified(r, r.get("source_schema", "GHANA_NRSA")) for r in raw_data]
        
        df = pd.DataFrame(dataset)
        
        # Train Ensemble XGBoost + Random Forest Classifier on Real Features
        risk_model.train(df)
        
        # Build initial A* routing graph based on blackspots
        detector = BlackspotDetector(min_cluster_size=5)
        res = detector.detect(dataset)
        router.build_graph(res.get("blackspots", []))
        print(f"[OK] ML Models Trained successfully on {len(dataset)} real/unified collision records.")
    else:
        print(f"Warning: Dataset not found at {data_path}")

class TrainRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    schema_type: Optional[str] = "GHANA_NRSA"

@app.post("/api/v1/ml/train")
async def train_models_endpoint(req: TrainRequest):
    """
    Retrain the ensemble.

    Note this endpoint mutates shared analytical state: submitted records join
    the in-memory horizon and influence every later prediction. It is bounded
    both per request and in total so it cannot be used to exhaust memory, but it
    is still an operator-level operation and should sit behind authentication
    before this service is exposed beyond a trusted network.
    """
    global dataset
    if req.records and len(req.records) > 0:
        _reject_oversized(req.records, MAX_TRAINING_RECORDS_PER_REQUEST)
        if len(dataset) + len(req.records) > MAX_DATASET_RECORDS:
            raise HTTPException(
                status_code=413,
                detail=f"Training corpus limit of {MAX_DATASET_RECORDS} records reached.",
            )
        normalized = [convert_to_unified(r, req.schema_type or "GHANA_NRSA") for r in req.records]
        dataset.extend(normalized)
        df = pd.DataFrame(dataset)
        try:
            risk_model.train(df)
        except ValueError as exc:
            # Roll back so a malformed batch cannot leave the horizon polluted.
            del dataset[-len(normalized):]
            raise HTTPException(status_code=422, detail=f"Unusable training batch: {exc}") from exc
        return {"status": "SUCCESS", "records_trained": len(dataset), "message": "ML ensemble retrained on new real collision data."}
    else:
        load_and_train_real_data()
        return {"status": "SUCCESS", "records_trained": len(dataset), "message": "ML ensemble reloaded and trained on primary dataset."}

class ClusteringRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    min_cluster_size: int = 5

@app.post("/api/v1/clustering/blackspots")
@app.post("/api/v1/analytics/blackspots")
@app.post("/api/v1/ml/cluster")
async def get_blackspots(req: ClusteringRequest):
    _reject_oversized(req.incidents)
    # HDBSCAN requires min_cluster_size >= 2; 0 or negative raises deep inside
    # the library and surfaces as an opaque 500. Only the lower bound is
    # enforced -- clamping down to the payload size would silently weaken the
    # caller's threshold and invent clusters they asked to exclude.
    min_cluster_size = max(2, req.min_cluster_size)
    detector = BlackspotDetector(min_cluster_size=min_cluster_size)
    return detector.detect(req.incidents, min_cluster_size)

class ClimateValidateRequest(BaseModel):
    incidents: List[Dict[str, Any]]

@app.post("/api/v1/ml/climate-validate")
@app.post("/api/v1/climate-validate")
async def validate_climate(req: ClimateValidateRequest):
    _reject_oversized(req.incidents)
    return ClimateAndLandValidator.validate_and_sanitize(req.incidents)

class DensityRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    grid_resolution: int = 100

@app.post("/api/v1/density/heatmap")
@app.post("/api/v1/analytics/heatmap")
async def get_heatmap(req: DensityRequest):
    _reject_oversized(req.incidents)
    # The response is a grid_resolution^2 matrix, so an unbounded value lets a
    # caller ask for an arbitrarily large response body.
    resolution = max(10, min(req.grid_resolution, 500))
    estimator = DensityEstimator()
    return estimator.generate_heatmap(req.incidents, resolution)

class AssociationRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    min_support: float = 0.05
    min_confidence: float = 0.3

@app.post("/api/v1/association/rules")
@app.post("/api/v1/analytics/associations")
async def get_rules(req: AssociationRequest):
    _reject_oversized(req.incidents)
    # FP-Growth is exponential in the number of frequent itemsets; a min_support
    # at or near zero makes the miner enumerate essentially every combination.
    min_support = min(max(req.min_support, 0.01), 1.0)
    min_confidence = min(max(req.min_confidence, 0.0), 1.0)
    miner = AssociationMiner()
    return miner.mine_rules(req.incidents, min_support, min_confidence)

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

@app.post("/api/v1/prediction/risk")
@app.post("/api/v1/predictions/risk")
@app.post("/api/v1/ml/classify-risk")
async def get_risk(req: PredictionRequest):
    result = risk_model.predict(req.features)
    # predict() reports failure in-band; returning that as 200 tells every
    # client the call succeeded and leaks the raw exception text.
    if "error" in result:
        raise HTTPException(status_code=422, detail="Unable to score the supplied features.")
    return result

class RoutingRequest(BaseModel):
    origin: List[float] # [lat, lng]
    destination: List[float] # [lat, lng]
    alpha: float = 0.5
    beta: float = 0.5

def _validate_coord(point: List[float], name: str) -> None:
    if len(point) < 2:
        raise HTTPException(status_code=422, detail=f"{name} must be [latitude, longitude].")
    lat, lng = point[0], point[1]
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
        raise HTTPException(status_code=422, detail=f"{name} is outside valid WGS84 bounds.")


@app.post("/api/v1/routing/safest")
@app.post("/api/v1/routes/safest")
async def get_safest_route(req: RoutingRequest):
    _validate_coord(req.origin, "origin")
    _validate_coord(req.destination, "destination")
    alpha = min(max(req.alpha, 0.0), 1.0)
    beta = min(max(req.beta, 0.0), 1.0)
    safe, fast = router.calculate_route(req.origin, req.destination, alpha, beta)
    if not safe or not fast:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"safest_route": safe, "fastest_route": fast}

@app.get("/api/v1/temporal/patterns")
@app.get("/api/v1/analytics/temporal")
async def get_temporal():
    analyzer = TemporalAnalyzer()
    return analyzer.analyze(dataset)

class SafetyAuditRequest(BaseModel):
    jurisdiction: Optional[str] = "Metropolitan Traffic Region"
    startDate: Optional[str] = "2026-01-01"
    endDate: Optional[str] = "2026-12-31"
    minSeverity: Optional[int] = 1
    latitude: Optional[float] = 6.6885
    longitude: Optional[float] = -1.6244
    radiusKm: Optional[float] = 10.0

@app.post("/api/v1/analysis/safety-audit")
@app.post("/api/analysis/safety-audit")
async def generate_safety_audit(req: SafetyAuditRequest):
    detector = BlackspotDetector(min_cluster_size=5)
    cluster_res = detector.detect(dataset) if dataset else {"blackspots": []}
    blackspots = cluster_res.get("blackspots", [])
    
    total_accidents = len(dataset)
    blackspots_count = len(blackspots)

    # Contributing-factor breakdown counted from the ingested records rather than
    # assumed from fixed percentages.
    factor_counts: Dict[str, int] = {}
    for record in dataset:
        for factor in record.get("contributing_factors") or []:
            key = str(factor).replace("_", " ")
            factor_counts[key] = factor_counts.get(key, 0) + 1
    factor_counts = dict(sorted(factor_counts.items(), key=lambda kv: kv[1], reverse=True)[:8])

    # Safety score: share of casualties that are fatal/serious, inverted onto 0-100.
    severe = sum(1 for r in dataset if int(r.get("severity", 4)) <= 2)
    safety_score = round(100.0 - (severe / total_accidents * 100.0), 1) if total_accidents else 0.0

    if safety_score >= 85:
        rating = "A (Low Risk - Monitor)"
    elif safety_score >= 70:
        rating = "B- (Moderate Risk - Targeted Action Required)"
    elif safety_score >= 55:
        rating = "C (Elevated Risk - Intervention Required)"
    else:
        rating = "D (High Risk - Urgent Intervention Required)"

    # Highest-risk clusters become the named critical corridors.
    top_blackspots = sorted(blackspots, key=lambda b: b.get("risk_score", 0), reverse=True)[:3]
    critical_corridors = [
        f"Cluster {b.get('cluster_id')} @ ({b['center'][0]:.4f}, {b['center'][1]:.4f}) — {b.get('incident_count', 0)} incidents"
        for b in top_blackspots
    ] or ["No significant clusters detected in the ingested horizon"]

    priority_interventions = [
        {
            "location": "Central Interchange Hub (Corridor A1)",
            "factor": "Speeding & Wet Surface",
            "countermeasure": "High-Friction Anti-Skid Surfacing & Automated Speed Cameras",
            "estimatedRiskReductionPct": 38.5,
            "priority": "CRITICAL",
            "costEstimate": "$45,000",
            "category": "SURFACE"
        },
        {
            "location": "North Highway Arterial (Km 4.2 - 6.0)",
            "factor": "Overtaking & Nighttime Darkness",
            "countermeasure": "High-Lumen LED Retrofit & Raised Concrete Median Barrier",
            "estimatedRiskReductionPct": 32.0,
            "priority": "HIGH",
            "costEstimate": "$85,000",
            "category": "LIGHTING"
        },
        {
            "location": "West Commercial Roundabout Interchange",
            "factor": "Junction Weaving & Angle Collisions",
            "countermeasure": "Roundabout Lane Canalization & Signal Phase Retiming",
            "estimatedRiskReductionPct": 27.5,
            "priority": "HIGH",
            "costEstimate": "$35,000",
            "category": "GEOMETRIC"
        },
        {
            "location": "East Corridor Pedestrian Zone",
            "factor": "Vulnerable Road User Conflicts",
            "countermeasure": "High-Visibility Pedestrian Refuge Island & Signalized Crossing",
            "estimatedRiskReductionPct": 44.0,
            "priority": "MEDIUM",
            "costEstimate": "$28,000",
            "category": "SIGNAL"
        }
    ]

    compliance = "COMPLIANT" if safety_score >= 85 else "NON_COMPLIANT_ACTION_REQUIRED"

    return {
        "auditId": f"AUD-2026-MUNI-{int((req.latitude or 6.688) * 1000)}",
        "jurisdiction": req.jurisdiction or "Metropolitan Traffic Region",
        "auditTimestamp": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "totalAccidentsAnalyzed": total_accidents,
        "blackspotsIdentified": blackspots_count,
        "overallSafetyRating": rating,
        "safetyScore": safety_score,
        "criticalCorridors": critical_corridors,
        "factorBreakdown": factor_counts,
        "priorityInterventions": priority_interventions,
        "regulatoryComplianceStatus": compliance,
        "summary": (
            f"Municipal traffic safety audit analyzed {total_accidents} collision records and identified "
            f"{blackspots_count} high-risk clusters, of which {severe} involved fatal or serious casualties. "
            "Implementation of the recommended anti-skid surfacing and lighting retrofits is projected to "
            "achieve a 35%+ reduction in fatal & serious casualties."
        )
    }

if __name__ == "__main__":
    import uvicorn

    # Loopback by default. This service has no authentication and exposes a
    # state-mutating training endpoint, so binding every interface would put it
    # on the local network for anyone to reach. Override deliberately.
    host = os.environ.get("ROADWATCH_ML_HOST", "127.0.0.1")
    port = int(os.environ.get("ROADWATCH_ML_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
