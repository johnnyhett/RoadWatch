# RoadWatch Codebase Audit & Technical Assessment Report (R1 – R5)

**Author:** Explorer Subagent  
**Working Directory:** `c:\Users\LMAA-0001\Desktop\GitHub PROJECTS\Traffic-Accident-Pattern-Recognition-System\.agents\explorer_r1_r5`  
**Date:** 2026-08-04  
**Project:** RoadWatch — Metropolitan Traffic Accident Pattern Recognition & Road Safety Engine  

---

## 1. Executive Summary

A comprehensive read-only architectural audit of the RoadWatch repository was conducted to evaluate system readiness across Requirements R1 through R5. 

### Key Findings Summary:
- **R1 (UI/UX & Interactive Design)**: High architectural quality. Next.js 16 (Turbopack) web application builds cleanly with **0 TypeScript and 0 Lint errors** (`npm run build` compiled 7 static/dynamic routes in 1.3s). Dark glassmorphism, Leaflet dark basemap, smooth camera `flyTo` transitions, and non-overlapping collapsible HUD panels are well-implemented.
- **R2 (Authentic Data & Ingestion)**: Current dataset generator (`data/generate_dataset.py`) is hardcoded to London bounding coordinates (`51.45–51.55, -0.20–0.05`) and lacks multi-country schema converters (Ghana NRSA, UK STATS19, US FARS, EU CARE). HDBSCAN clustering in `ml-engine/app/analytics/clustering.py` outputs raw cluster member points rather than a simplified 6-point organic spatial convex hull. Tropical climate rules (prohibiting Ice/Snow in African coordinates) exist in frontend mock generators but are missing in Python data generation scripts.
- **R3 (Backend & API Audit)**: Critical contract misalignments identified between Java Spring Boot 3.3 (Hexagonal Architecture) backend and Python FastAPI `ml-engine`:
  - `MlEngineAdapter.java` targets mismatched paths (e.g. `/api/v1/analytics/blackspots` vs ML engine `/api/v1/clustering/blackspots`).
  - `MlEngineAdapter.java` sends empty body requests for blackspots where `ml-engine` expects `incidents` JSON array.
  - Frontend (`frontend/src/lib/api.ts`) bypasses Spring Boot backend completely for ML calls, targeting `http://localhost:8000` directly with incompatible path names (`/analytics/blackspots`). As a result, all API requests fail silently and fall back to local mock data.
- **R4 (Institutional Safety Features)**: Blackspot Engineering Interventions (drawer with risk scores, factor co-occurrence breakdown, and mitigation recommendations) and Multi-Modal Route Safety Navigation (A* safest vs fastest routing with customizable safety weight sliders) are implemented in the UI and ML layer. However, Municipal Traffic Safety Audit reporting (`POST /api/analysis/safety-audit`) is unmapped in the backend, and Live Emergency Telemetry Ticker uses simulated local timers rather than live WebSocket STOMP streaming (`ws://localhost:8080/ws`).
- **R5 (Codebase Health)**: Identified orphaned component (`frontend/src/components/routing/RouteMap.tsx`), silent empty exception handlers in `frontend/src/lib/api.ts`, missing build execution scripts for Maven due to uncommitted wrapper binaries, and ununified environment variable management.

---

## 2. Requirement R1: UI/UX & Interactive Design Upgrade

### 2.1 Component Structure & Styling Architecture
- **Framework**: Next.js 16.3.0 App Router with TypeScript and React 19.
- **CSS Architecture**: `frontend/src/app/globals.css` defines custom dark glassmorphism CSS utilities:
  ```css
  .glass-card {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  ```
  Deep dark theme background `#070a0f` with fixed radial ambient gradients.
- **Layout & Z-Index Management**:
  - `frontend/src/app/page.tsx` features non-overlapping collapsible HUD controls:
    - Left Floating Panel (`w-[320px]`, z-10): Presets, spatial layer toggles, severity filters, high-risk hotspot list.
    - Right Floating Panel (`w-[360px]`, z-10): Real-time stats grid, severity distribution chart, temporal trend chart.
    - Top Navbar (`h-14`, z-50): Brand logo, location search bar with OpenStreetMap Nominatim geocoding, datasource selector, navigation tabs.
    - Bottom HUD (`w-full max-w-3xl`, z-10): Live incident ticker bar.

### 2.2 Interactive Map & Spatial Camera Movement
- **Map Container**: `frontend/src/components/map/MapContainer.tsx` renders Leaflet dark tile basemap (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).
- **Custom Markers**: SVG DivIcons styled with severity-based glow effects:
  - Fatal: Red (`#ef4444`) with drop-shadow glow.
  - Serious: Orange (`#f97316`).
  - Slight: Yellow (`#eab308`).
  - Damage Only: Emerald (`#10b981`).
- **Camera FlyTo Controller**:
  ```typescript
  function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
      if (center && center[0] !== 0 && center[1] !== 0) {
        map.flyTo(center, zoom || 14, { animate: true, duration: 1.6 });
      }
    }, [center, zoom, map]);
    return null;
  }
  ```
  Instantly and smoothly flies camera to user GPS coordinates, searched locations, or selected blackspot clusters.

### 2.3 Compilation Readiness
- `npx tsc --noEmit`: Executed cleanly with **0 errors**.
- `npm run build`: Executed cleanly with **0 errors**. Compiled 7 static and dynamic pages (`/`, `/_not-found`, `/analytics`, `/api/incidents`, `/routes`) in 1307ms.

---

## 3. Requirement R2: Authentic Data Sources & Ingestion Pipeline

### 3.1 Data Schema Audit (`data/`)
- **Dataset File**: `data/synthetic_traffic_accidents.json` contains 1,500 records.
- **Generator Script**: `data/generate_dataset.py` generates synthetic records with London bounding coordinates (`LAT_MIN = 51.45, LAT_MAX = 51.55, LNG_MIN = -0.20, LNG_MAX = 0.05`).
- **Open Data Schemas Gap**: The project documentation mentions supporting Ghana NRSA, UK DfT STATS19, US NHTSA FARS, and EU CARE schemas. However, `data/` contains no dedicated parsing or transformation modules for these schemas.

### 3.2 HDBSCAN 6-Point Blackspot Clustering
- **Implementation**: `ml-engine/app/analytics/clustering.py` uses `hdbscan.HDBSCAN(min_cluster_size=5, metric='euclidean')` after projecting WGS84 coordinates into UTM Cartesian metric space (`epsg:32630`).
- **Defect in Boundary Extraction**:
  - In `clustering.py` (lines 33–36), `bounds` appends raw point coordinates for every point in the cluster rather than constructing an organic 6-point convex hull polygon boundary.
  - In contrast, frontend mock fallback (`frontend/src/lib/api.ts`, lines 146–153) explicitly constructs a 6-point radial polygon.

### 3.3 Land-Bound Coordinate Filtering & Tropical Climate Rules
- **Land-Bound Filtering**: `generate_dataset.py` does not include coastal boundary filtering (e.g. removing points falling into the ocean near coastal cities like Accra, Ghana). In `frontend/src/lib/api.ts` (line 78), points near Accra below latitude `5.548` are clamped.
- **Tropical Climate Rules**:
  - `frontend/src/lib/api.ts` defines `getRealisticEnvironment(lat)` (lines 21–40), which enforces that if `Math.abs(lat) < 23.5` (tropical zones), weather/road surface options exclude `Snowing`, `Frost / Ice`, and `Snow`.
  - However, `data/generate_dataset.py` (lines 74–80) randomly generates `"Snowing"` (5%) and `"Ice"` (5%) regardless of geographic coordinates.

---

## 4. Requirement R3: Backend Architecture & API Audit

### 4.1 Architecture Overview
- **Backend Service**: Java 21 / Spring Boot 3.3 located in `backend/`.
- **Architecture Style**: Clean / Hexagonal Architecture:
  - `domain/model/`: Immutable records (`Incident`, `Blackspot`, `RiskPrediction`, `SafetyRoute`, `AssociationRule`, `TemporalPattern`).
  - `application/port/in/`: Inbound use case interfaces (`GetIncidentsUseCase`, `ExtractPatternsUseCase`, `PredictRiskUseCase`, `ComputeRouteUseCase`).
  - `application/port/out/`: Outbound port interfaces (`IncidentRepositoryPort`, `MlEnginePort`).
  - `application/service/`: Application services.
  - `infrastructure/web/controller/`: REST controllers (`IncidentController`, `AnalyticsController`, `PredictionController`, `RouteController`).
  - `infrastructure/ml/MlEngineAdapter.java`: WebClient adapter calling Python FastAPI service.
- **ML Engine**: Python 3.12 FastAPI microservice located in `ml-engine/`.

### 4.2 API Endpoint & Contract Misalignment Audit

#### Matrix 1: Frontend ↔ Backend Endpoint Discrepancies
| Interface Function | Frontend Target (`lib/api.ts`) | Backend Actual Mapping | Status |
| :--- | :--- | :--- | :--- |
| `getIncidents()` | `GET ${API_BASE_URL}/api/incidents` | `GET /api/v1/incidents/` | ❌ **404 Mismatch** (Missing `/v1`) |
| `getBlackspots()` | `GET ${ML_ENGINE_URL}/analytics/blackspots` | `POST /api/v1/analytics/blackspots` | ❌ **Bypasses Backend & Verb Mismatch** |
| `getAssociationRules()` | `GET ${ML_ENGINE_URL}/analytics/association-rules` | `POST /api/v1/analytics/associations` | ❌ **Bypasses Backend & Path Mismatch** |
| `getTemporalPatterns()` | `GET ${ML_ENGINE_URL}/analytics/temporal-patterns` | `GET /api/v1/analytics/temporal` | ❌ **Bypasses Backend & Path Mismatch** |
| `predictRisk()` | `POST ${ML_ENGINE_URL}/predict/risk` | `POST /api/v1/predictions/risk` | ❌ **Bypasses Backend & Path Mismatch** |
| `getSafestRoute()` | Local JavaScript Mock (`computeSafetyRoute`) | `POST /api/v1/routes/safest` | ❌ **Not Wired to Backend** |

#### Matrix 2: Backend `MlEngineAdapter` ↔ Python FastAPI ML Engine Endpoint Discrepancies
| Outbound Method in `MlEngineAdapter.java` | Java Adapter Called Endpoint | Python FastAPI Endpoint (`main.py`) | Request Payload Discrepancy |
| :--- | :--- | :--- | :--- |
| `findBlackspots()` | `POST /api/v1/analytics/blackspots` | `POST /api/v1/clustering/blackspots` | Java sends empty body; Python expects `ClusteringRequest` with `incidents` list. |
| `generateHeatmap()` | `POST /api/v1/analytics/heatmap` | `POST /api/v1/density/heatmap` | Path mismatch (`analytics/heatmap` vs `density/heatmap`). |
| `mineAssociations()` | `POST /api/v1/analytics/associations` | `POST /api/v1/association/rules` | Path mismatch (`analytics/associations` vs `association/rules`). Java sends empty body; Python expects `AssociationRequest`. |
| `getTemporalPatterns()` | `GET /api/v1/analytics/temporal` | `GET /api/v1/temporal/patterns` | Path mismatch (`analytics/temporal` vs `temporal/patterns`). |
| `predictRisk()` | `POST /api/v1/predictions/risk` | `POST /api/v1/prediction/risk` | Path mismatch (`predictions/risk` vs `prediction/risk`). Java sends `weatherCondition`; Python expects `weather`. |
| `computeSafestRoute()` | `POST /api/v1/routes/safest` | `POST /api/v1/routing/safest` | Path mismatch (`routes/safest` vs `routing/safest`). Java sends `startLatitude`, `startLongitude`; Python expects `origin: [lat, lng]`, `destination: [lat, lng]`. |

---

## 5. Requirement R4: Institutional Safety Features Audit

1. **Municipal Traffic Safety Audits**:
   - `PROJECT.md` defines `POST /api/analysis/safety-audit`.
   - **Current State**: Neither the Java backend nor Python ML engine contains a controller endpoint or service implementation for municipal safety audits.
2. **Blackspot Engineering Interventions**:
   - **Current State**: **Fully Implemented in UI & ML**. `frontend/src/components/blackspot/BlackspotDrawer.tsx` dynamically generates mitigation measures (automated speed cameras, LED junction lighting upgrades, anti-skid high-friction surfacing) based on factor co-occurrence. `ml-engine/app/ml/risk_model.py` lines 73–82 also generates recommendations.
3. **Real-Time Emergency Telemetry Ticker**:
   - **Current State**: `frontend/src/components/dashboard/LiveTicker.tsx` renders a high-density alert ticker with interactive "View on Map" camera panning. However, the stream is simulated using `setInterval` timers rather than consuming live STOMP WebSocket frames from Java `IncidentStreamHandler.java` (`ws://localhost:8080/ws`).
4. **Multi-Modal Route Safety Navigation**:
   - **Current State**: **Fully Implemented**. `frontend/src/app/routes/page.tsx`, `RouteForm.tsx`, and `RouteComparison.tsx` support safety-weighted path calculation ($W(e) = \alpha \cdot \text{Time}(e) + \beta \cdot \text{RiskScore}(e)$) using a 10%–90% safety slider and NetworkX graph search (`ml-engine/app/routing/safety_router.py`).

---

## 6. Requirement R5: Codebase Health & Full Audit

### 6.1 Orphaned & Unused Code
- **`frontend/src/components/routing/RouteMap.tsx`**: Orphaned component file (140 lines). `app/routes/page.tsx` dynamically imports `MapContainer.tsx` directly instead of using `RouteMap.tsx`.

### 6.2 Error Handling & Fallback Silencing
- `frontend/src/lib/api.ts` contains empty `catch (e) {}` blocks across all API wrapper functions (`getIncidents`, `getBlackspots`, `getAssociationRules`, `getTemporalPatterns`, `predictRisk`). When network calls fail due to the contract misalignments documented in Section 4, errors are completely silenced and the system silently falls back to local synthetic mock generators.

### 6.3 Missing Endpoints & Contract Enforcement
- Missing explicit validation for tropical climate rules on backend ingestion.
- Missing OpenAPI / Swagger documentation synchronization across Java and Python services.

---

## 7. Comprehensive Remediation Plan & Recommendations

### Action Item 1: Unify REST API Paths Across Frontend, Backend, and ML Engine
- Standardize all endpoints in `PROJECT.md` contract format:
  - Incident Service: `/api/v1/incidents`
  - Blackspots: `/api/v1/analytics/blackspots`
  - Risk Surface Heatmap: `/api/v1/analytics/heatmap`
  - Association Rules: `/api/v1/analytics/association-rules`
  - Temporal Patterns: `/api/v1/analytics/temporal-patterns`
  - Risk Prediction: `/api/v1/predict/risk`
  - Safety Routing: `/api/v1/navigation/safe-route`
  - Municipal Safety Audit: `/api/v1/analysis/safety-audit`

### Action Item 2: Fix `MlEngineAdapter.java` WebClient Payloads
- Update `MlEngineAdapter.java` to construct proper JSON request payloads containing the `incidents` list for `findBlackspots()`, `generateHeatmap()`, and `mineAssociations()`.
- Format `origin` and `destination` as `[lat, lng]` double arrays for `computeSafestRoute()`.

### Action Item 3: Harden ML Engine & Data Ingestion Pipeline
- Update `ml-engine/app/analytics/clustering.py` to extract a 6-point organic convex hull boundary using `scipy.spatial.ConvexHull` or spatial geometric polygon reduction.
- Add tropical climate rule validation (`lat < 23.5` prohibits Ice/Snow) in `data/generate_dataset.py` and `ml-engine/app/ml/feature_engine.py`.
- Add coastal land boundary polygon check for Ghana/Accra to prevent ocean incident placement.

### Action Item 4: Implement Municipal Safety Audit Endpoint & Wire WebSockets
- Implement `POST /api/v1/analysis/safety-audit` in Spring Boot `AnalyticsController.java` returning structured audit summaries.
- Wire `LiveTicker.tsx` to subscribe to Spring Boot STOMP WebSocket topic `/topic/incidents`.

### Action Item 5: Clean Up Orphaned Files & Error Handling
- Remove or integrate `frontend/src/components/routing/RouteMap.tsx`.
- Replace empty `catch (e) {}` blocks in `frontend/src/lib/api.ts` with structured console logging and error notification toasts.
