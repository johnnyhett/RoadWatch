import json
import os
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

app = FastAPI(title="Traffic Accident Pattern Recognition System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
dataset = []
risk_model = RiskModel()
router = SafetyRouter()

@app.on_event("startup")
async def startup_event():
    global dataset
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "synthetic_traffic_accidents.json")
    if os.path.exists(data_path):
        with open(data_path, "r") as f:
            dataset = json.load(f)
            
        df = pd.DataFrame(dataset)
        risk_model.train(df)
        
        # Build initial routing graph based on blackspots
        detector = BlackspotDetector(min_cluster_size=5)
        res = detector.detect(dataset)
        router.build_graph(res.get("blackspots", []))
        print("Models trained and graph built.")
    else:
        print(f"Warning: Dataset not found at {data_path}")

class ClusteringRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    min_cluster_size: int = 5

@app.post("/api/v1/clustering/blackspots")
async def get_blackspots(req: ClusteringRequest):
    detector = BlackspotDetector(min_cluster_size=req.min_cluster_size)
    return detector.detect(req.incidents, req.min_cluster_size)

class DensityRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    grid_resolution: int = 100

@app.post("/api/v1/density/heatmap")
async def get_heatmap(req: DensityRequest):
    estimator = DensityEstimator()
    return estimator.generate_heatmap(req.incidents, req.grid_resolution)

class AssociationRequest(BaseModel):
    incidents: List[Dict[str, Any]]
    min_support: float = 0.05
    min_confidence: float = 0.3

@app.post("/api/v1/association/rules")
async def get_rules(req: AssociationRequest):
    miner = AssociationMiner()
    return miner.mine_rules(req.incidents, req.min_support, req.min_confidence)

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

@app.post("/api/v1/prediction/risk")
async def get_risk(req: PredictionRequest):
    return risk_model.predict(req.features)

class RoutingRequest(BaseModel):
    origin: List[float] # [lat, lng]
    destination: List[float] # [lat, lng]
    alpha: float = 0.5
    beta: float = 0.5

@app.post("/api/v1/routing/safest")
async def get_safest_route(req: RoutingRequest):
    safe, fast = router.calculate_route(req.origin, req.destination, req.alpha, req.beta)
    if not safe or not fast:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"safest_route": safe, "fastest_route": fast}

@app.get("/api/v1/temporal/patterns")
async def get_temporal():
    analyzer = TemporalAnalyzer()
    return analyzer.analyze(dataset)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
