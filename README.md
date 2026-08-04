# RoadWatch
### Metropolitan Traffic Accident Pattern Recognition & Road Safety Engine

> **Course**: Computational and Problem-Solving Course — Institutional Group Project

**RoadWatch** is an enterprise-grade traffic accident pattern recognition and predictive safety engine designed for road safety analytics. 

Rather than relying on basic statistical aggregations, RoadWatch executes advanced computational pattern recognition algorithms (spatial density clustering, frequent itemset association mining, kernel density estimation, and safety-weighted pathfinding) to empower urban planners, traffic engineers, and drivers.

---

## 🏛️ System Architecture

```
                                    +------------------------------------------+
                                    |         Next.js 14 Web Frontend          |
                                    |     (Dark Modern Real-Time Dashboard)    |
                                    +------------------------------------------+
                                                          │
                                              REST API & WebSocket STOMP
                                                          ▼
                                    +------------------------------------------+
                                    |        Java Spring Boot 3.3 Backend      |
                                    |     (Clean / Hexagonal Architecture)     |
                                    +------------------------------------------+
                                                          │
                                                    HTTP / REST
                                                          ▼
                                    +------------------------------------------+
                                    |     Python FastAPI Analytical Engine     |
                                    |  (HDBSCAN, FP-Growth, XGBoost, A* Graph) |
                                    +------------------------------------------+
```

---

## 🔬 Core Pattern Recognition & ML Capabilities

| Module | Computational Method | Practical Application |
| :--- | :--- | :--- |
| **Spatial Hotspot Discovery** | **HDBSCAN** (UTM Cartesian metric space projection) | Isolates high-density accident hotspots from background noise regardless of cluster shape |
| **Continuous Risk Heatmap** | **Kernel Density Estimation (KDE)** (Gaussian kernel) | Computes smooth spatial crash risk surfaces weighted by severity levels |
| **Multi-Factor Association Mining** | **FP-Growth Algorithm** (FP-Tree mining) | Extracts non-obvious crash co-occurrence patterns (e.g. `{Wet Road + Night + Unlit Junction} → High Severity Risk`) with Support, Confidence, & Lift metrics |
| **Predictive Risk Scoring** | **XGBoost Classifier** | Predicts crash severity probabilities based on real-time environmental, temporal, and infrastructure parameters |
| **Safety-Aware Route Navigation** | **Weighted A* / Dijkstra Graph Search** | Solves $W(e) = \alpha \cdot \text{Time}(e) + \beta \cdot \text{RiskScore}(e, t) \cdot \text{Length}(e)$ to compare Fastest vs. Safest travel routes |
| **Real-Time Stream Simulation** | **WebSocket STOMP Channel** | Pushes live simulated accident events and dynamic reroute warnings to connected clients |

---

## 📁 Repository Structure

```
Traffic-Accident-Pattern-Recognition-System/
├── frontend/                 # Next.js 14 App Router Web Client (TypeScript + Tailwind)
│   ├── src/app/              # Dashboard (/), Pattern Analytics (/analytics), Route Safety (/routes)
│   ├── src/components/       # Map, Charts, Blackspot Drawer, Association Graph, Route Form
│   └── src/lib/              # REST API & WebSocket Client Services
├── backend/                  # Java Spring Boot 3.3 REST API & WebSocket Server
│   ├── src/main/java/com/taprs/
│   │   ├── application/      # Hexagonal Ports & Application Services
│   │   ├── domain/           # Immutable Domain Records & Models
│   │   └── infrastructure/   # Controllers, WebSocket Handlers, ML WebClient Adapter, Repository
│   ├── pom.xml               # Maven Build Configuration
│   └── build.gradle          # Gradle Build Configuration
├── ml-engine/                # Python FastAPI Microservice
│   ├── app/analytics/        # HDBSCAN, KDE, FP-Growth, and Temporal Decomposition modules
│   ├── app/ml/               # XGBoost Model Training & Inference Pipeline
│   ├── app/routing/          # NetworkX Safety-Aware A* Routing Solver
│   └── main.py               # FastAPI Server Application
└── data/                     # Data Ingestion & Generation
    ├── generate_dataset.py   # Realistic Spatial-Temporal Accident Data Generator
    └── synthetic_traffic_accidents.json  # Pre-generated 1,500+ Record Dataset
```

---

## ⚡ Quick Start Guide

### 1. Launch the Analytics ML Microservice
```bash
cd ml-engine
pip install -r requirements.txt
python main.py
# Running on http://localhost:8000
```

### 2. Launch the Java Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
# OR
gradle bootRun
# Running on http://localhost:8080
```

### 3. Launch the Next.js Dashboard
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 🎯 Verification & Build Status

- **Frontend Build**: `npm run build` executed cleanly (Static & App Router pages compiled in TypeScript).
- **Backend Architecture**: Clean/Hexagonal separation verified with `SNAKE_CASE` JSON serialization and STOMP WebSocket broadcasting.
- **ML Pipeline**: HDBSCAN, FP-Growth, KDE, XGBoost, and NetworkX verified with 1,500+ spatial records.
