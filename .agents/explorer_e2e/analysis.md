# E2E Testing Infrastructure & Test Suite Architecture Analysis (Tiers 1–4)

## Executive Summary & Scope

This report provides the architectural design, specification, and layout for the opaque-box, requirement-driven End-to-End (E2E) Testing Infrastructure and Test Suite (Tiers 1–4) for **RoadWatch** (Metropolitan Traffic Accident Pattern Recognition & Road Safety Engine).

The testing suite validates all requirements (R1–R4) across the complete system stack:
- **Frontend UI/UX**: Next.js 14/15 TypeScript web application (`frontend/`)
- **Backend Microservice**: Java 21 Spring Boot 3.3 Hexagonal REST API & WebSocket STOMP (`backend/`)
- **ML Analytics Engine**: Python 3.12 FastAPI analytical microservice (`ml-engine/`)
- **Data Ingestion & Pipeline**: Multi-country data schemas & synthesis (`data/`)

---

## 1. System Architecture & Codebase Component Review

### 1.1 Frontend Component (`frontend/`)
- **Framework**: Next.js 16 / React 19 App Router with TypeScript 5, Tailwind CSS 4, Framer Motion, Recharts, Leaflet / React-Leaflet, `@stomp/stompjs` WebSocket client.
- **Key Routes**:
  - `/` (Main Dashboard with StatsGrid, TemporalChart, SeverityChart, MapContainer, LiveTicker)
  - `/analytics` (AssociationGraph, FactorHeatmap, RuleTable)
  - `/routes` (Route Form, Origin/Destination selection, Alpha/Beta weight sliders)
- **API Clients**: Next.js internal API routes (`/api/incidents`, `/api/predict`) communicating with backend Java service at `http://localhost:8080`.

### 1.2 Backend Component (`backend/`)
- **Framework**: Java 21 Spring Boot 3.3.0 Hexagonal / Clean Architecture.
- **Port Interfaces**:
  - `GetIncidentsUseCase`, `ExtractPatternsUseCase`, `PredictRiskUseCase`, `ComputeRouteUseCase`
  - `IncidentRepositoryPort`, `MlEnginePort`
- **Controllers & Endpoints**:
  - `GET /api/v1/incidents/`, `GET /api/v1/incidents/{id}`, `GET /api/v1/incidents/stats`, `GET /api/v1/incidents/geojson`
  - `POST /api/v1/analytics/blackspots`, `POST /api/v1/analytics/heatmap`, `POST /api/v1/analytics/associations`, `GET /api/v1/analytics/temporal`
  - `POST /api/v1/predictions/risk`
  - `POST /api/v1/routes/safest`
- **WebSocket STOMP Channel**: `IncidentStreamHandler` broadcasting on `/topic/live-telemetry` via `/ws-traffic`.

### 1.3 ML Engine Component (`ml-engine/`)
- **Framework**: Python 3.12 FastAPI, Uvicorn, HDBSCAN, FP-Growth (`mlxtend`), XGBoost, NetworkX, Scikit-Learn, PyProj.
- **Core Analytics Modules**:
  - `BlackspotDetector`: UTM projection + HDBSCAN clustering (min_cluster_size=5).
  - `DensityEstimator`: Gaussian Kernel Density Estimation (KDE) grid risk mapping.
  - `AssociationMiner`: FP-Growth frequent itemset mining (support, confidence, lift).
  - `TemporalAnalyzer`: Hourly, daily, seasonal crash decomposition.
  - `RiskModel`: XGBoost multi-factor severity prediction.
  - `SafetyRouter`: NetworkX weighted A* solver ($W(e) = \alpha \cdot \text{Time} + \beta \cdot \text{RiskScore}$).
- **Endpoints**:
  - `POST /api/v1/clustering/blackspots`
  - `POST /api/v1/density/heatmap`
  - `POST /api/v1/association/rules`
  - `POST /api/v1/prediction/risk`
  - `POST /api/v1/routing/safest`
  - `GET /api/v1/temporal/patterns`

### 1.4 Data Pipeline Component (`data/`)
- `generate_dataset.py`: Synthetic traffic accident generator producing 1,500+ spatial-temporal records (`synthetic_traffic_accidents.json`) with multi-country schema attributes (latitude, longitude, timestamp, severity, weather, road surface, light condition, speed limit, junction detail, vehicle types, contributing factors).

---

## 2. E2E Testing Infrastructure Architecture

### 2.1 Framework & Stack Selection
- **Runner Stack**: Python 3.12 `pytest` ecosystem with `requests` (REST HTTP API testing), `websocket-client` (STOMP WebSocket verification), `pytest-asyncio`, and Playwright / HTTP headless interaction.
- **Rationale**: Python pytest offers seamless cross-service HTTP REST inspection, native JSON schema assertion, async STOMP WebSocket stream auditing, and rapid execution speed.

### 2.2 Repository Directory Layout
Per `PROJECT.md` compliance, all test code is located in a dedicated top-level directory (`tests/e2e/`), completely separate from `.agents/` metadata.

```
tests/e2e/
├── __init__.py
├── conftest.py                           # Fixtures for URLs, API clients, WebSocket connection, synthetic data
├── requirements.txt                      # Pytest, requests, websocket-client, pytest-asyncio, jsonschema
├── run_e2e_tests.py                      # Test orchestrator & runner script
├── test_tier1_feature_coverage.py       # Tier 1: Feature Coverage (>=5 tests per R1, R2, R3, R4 feature)
├── test_tier2_boundary_corner.py        # Tier 2: Boundary & Corner Cases (>=5 tests per R1, R2, R3, R4 feature)
├── test_tier3_pairwise_combos.py        # Tier 3: Cross-Feature Integration Pairwise Matrix
└── test_tier4_institutional_scenarios.py # Tier 4: Real-World Institutional Application Workflows
```

---

## 3. Tier 1 Test Suite Design: Feature Coverage (>=5 Tests per Feature)

Tier 1 mandates at least 5 distinct opaque-box tests per feature across R1, R2, R3, and R4.

### 3.1 Requirement 1: UI/UX & Interactive Design Features

#### Feature R1.1: Web Dashboard & Navigation Interface
1. `test_r1_1_1_dashboard_root_page_load`: Request `GET /` on frontend server. Assert HTTP 200, HTML contains main container, DOM includes navigation links (`/`, `/analytics`, `/routes`).
2. `test_r1_1_2_analytics_page_load`: Request `GET /analytics`. Assert HTTP 200, DOM contains AssociationGraph, FactorHeatmap, and RuleTable view mounts.
3. `test_r1_1_3_routes_page_load`: Request `GET /routes`. Assert HTTP 200, DOM contains route input form (start lat/lng, end lat/lng, travel mode, weight sliders).
4. `test_r1_1_4_stats_grid_component_render`: Verify frontend `/api/incidents` endpoint returns summary statistics (total accidents, severity breakdown) matching DOM render expectations.
5. `test_r1_1_5_responsive_layout_structure`: Validate page layout includes viewport meta tag and CSS flex/grid layout elements for responsive high-density analytics.

#### Feature R1.2: Map Visualization & Instant Camera Movement
1. `test_r1_2_1_map_container_initialization`: Verify Leaflet/Mapbox canvas container element initializes with default view coordinates and zoom parameter.
2. `test_r1_2_2_camera_instant_flyto_trigger`: Trigger spatial focal point change (e.g. fly to blackspot centroid). Assert map center state updates to target lat/lng without DOM errors.
3. `test_r1_2_3_spatial_layer_visibility_toggle`: Toggle incident marker layer vs. KDE density heatmap layer. Verify layer visibility state flags update correctly.
4. `test_r1_2_4_non_overlapping_control_placement`: Verify map legend, zoom controls, and drawer components maintain distinct z-index layer hierarchy to prevent overlap.
5. `test_r1_2_5_dark_glassmorphism_styling`: Inspect CSS stylesheet/token definitions to ensure dark theme parameters (`backdrop-filter`, dark transparency RGBA) are applied.

---

### 3.2 Requirement 2: Authentic Data Sources & Ingestion Pipeline Features

#### Feature R2.1: Multi-Country Open-Data Ingestion Schemas
1. `test_r2_1_1_ghana_nrsa_schema_ingestion`: Post Ghana NRSA format incident record (region, corridor, severity 1-3, road condition). Verify parsing into domain `Incident` model.
2. `test_r2_1_2_uk_stats19_schema_ingestion`: Post UK DfT STATS19 format record (`Accident_Index`, `Location_Easting/Northing`, `Police_Force`). Verify spatial conversion and ingestion.
3. `test_r2_1_3_us_fars_schema_ingestion`: Post US NHTSA FARS format record (`ST_CASE`, `FATALS`, `WEATHER`, `PERNOTST`). Verify property mapping.
4. `test_r2_1_4_eu_care_schema_ingestion`: Post EU CARE standardized crash schema attributes into ingestion handler. Verify schema validation success.
5. `test_r2_1_5_invalid_schema_quarantine`: Post record missing mandatory spatial lat/lng or timestamp. Verify pipeline returns HTTP 400 or quarantines record cleanly.

#### Feature R2.2: HDBSCAN Organic Spatial Clustering
1. `test_r2_2_1_hdbscan_cluster_extraction`: Execute `POST /api/v1/analytics/blackspots` with 100+ clustered spatial points. Assert return of organic blackspot clusters (min_cluster_size >= 6).
2. `test_r2_2_2_no_grid_stripe_artifacts`: Analyze bounding polygon geometry of returned blackspot clusters. Assert cluster bounds form organic convex hulls, not rigid rectangular grid stripes.
3. `test_r2_2_3_hdbscan_noise_exclusion`: Verify points assigned noise label (-1) by HDBSCAN are excluded from blackspot severity aggregation metrics.
4. `test_r2_2_4_cluster_centroid_geodesic_accuracy`: Verify cluster centroid lat/lon lies within the bounding spatial extent of member incidents.
5. `test_r2_2_5_min_cluster_size_param_tuning`: Post clustering request with `min_cluster_size=10` vs `min_cluster_size=5`. Verify cluster count dynamically adjusts.

#### Feature R2.3: Land-Bound Coordinate Boundaries
1. `test_r2_3_1_coastal_ocean_coordinate_rejection`: Submit incident with oceanic coordinates (e.g. lat 5.5, lon -1.5 in Gulf of Guinea). Assert validation flags as non-land / rejected.
2. `test_r2_3_2_inland_coordinate_acceptance`: Submit incident with valid inland Accra coordinates (lat 5.55, lon -0.20). Assert successful validation.
3. `test_r2_3_3_zero_ocean_marker_query_guarantee`: Query `GET /api/v1/incidents/` or `/geojson`. Verify 100% of returned incident coordinates fall within land GIS polygon boundaries.
4. `test_r2_3_4_spatial_coordinate_bounds_range`: Submit lat 95.0 or lon -190.0. Verify HTTP 400 constraint violation error.
5. `test_r2_3_5_coastal_polygon_lookup_precision`: Test boundary coordinates within 50 meters of coastline. Verify accurate land-sea classification via polygon lookup.

#### Feature R2.4: Climate-Aware Environmental Rules
1. `test_r2_4_1_tropical_climate_prohibits_snow`: Submit incident in tropical zone (e.g. Ghana lat ~5.5° N) with `weather="Snowing"`. Assert rule engine rejects or flags invalid environmental combination.
2. `test_r2_4_2_tropical_climate_prohibits_ice`: Submit incident in tropical zone with `road_surface="Ice"`. Assert rule violation flag.
3. `test_r2_4_3_temperate_climate_allows_winter_snow`: Submit incident in temperate zone (e.g. UK lat ~51.5° N, January) with `weather="Snowing"`. Assert validation success.
4. `test_r2_4_4_weather_surface_consistency`: Submit `weather="Clear"` with `road_surface="Flooded"`. Verify automated consistency warning/adjustment.
5. `test_r2_4_5_climate_rule_audit_logging`: Submit invalid climate-factor payload. Verify system generates audit log entry for invalid climate rule trigger.

---

### 3.3 Requirement 3: Backend Architecture & API Audit Features

#### Feature R3.1: Java Spring Boot REST Controllers & Hexagonal Ports
1. `test_r3_1_1_get_incidents_all`: Execute `GET /api/v1/incidents/`. Assert HTTP 200, content-type `application/json`, response is non-empty list of `Incident` domain objects.
2. `test_r3_1_2_get_incident_by_id`: Execute `GET /api/v1/incidents/{id}` with valid UUID. Assert HTTP 200 and matching ID in response payload.
3. `test_r3_1_3_get_incidents_stats`: Execute `GET /api/v1/incidents/stats`. Assert HTTP 200, response contains total count, average severity, and categorical distributions.
4. `test_r3_1_4_get_incidents_geojson`: Execute `GET /api/v1/incidents/geojson`. Assert HTTP 200, response is valid GeoJSON `FeatureCollection` with `Point` geometries.
5. `test_r3_1_5_get_analytics_temporal`: Execute `GET /api/v1/analytics/temporal`. Assert HTTP 200, response contains hourly peak distributions and day-of-week aggregations.

#### Feature R3.2: Python FastAPI ML Engine Endpoints
1. `test_r3_2_1_ml_clustering_blackspots`: Post list of incidents to FastAPI `/api/v1/clustering/blackspots`. Assert HTTP 200 and return of `blackspots` list.
2. `test_r3_2_2_ml_density_heatmap`: Post incident coordinates to FastAPI `/api/v1/density/heatmap`. Assert HTTP 200 and 2D grid density risk matrix.
3. `test_r3_2_3_ml_association_rules`: Post incident transaction list to FastAPI `/api/v1/association/rules`. Assert return of rules with `support`, `confidence`, `lift`.
4. `test_r3_2_4_ml_prediction_risk`: Post feature dict to FastAPI `/api/v1/prediction/risk`. Assert return of severity probability score (0.0 to 1.0) and risk category.
5. `test_r3_2_5_ml_routing_safest`: Post origin `[51.50, -0.12]` and destination `[51.52, -0.08]` to FastAPI `/api/v1/routing/safest`. Assert return of `safest_route` and `fastest_route`.

#### Feature R3.3: Endpoint Hardening, DTO Sync & Mock Removal
1. `test_r3_3_1_no_hardcoded_mock_fallbacks`: Verify backend query responses reflect actual database/ML engine calculations, not static mock constants.
2. `test_r3_3_2_cors_header_verification`: Send OPTIONS preflight request to `/api/v1/incidents/`. Assert `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` headers exist.
3. `test_r3_3_3_dto_json_serialization_field_match`: Verify property names serialized by Java backend match exact typescript interfaces expected by frontend.
4. `test_r3_3_4_global_exception_handler`: Send malformed JSON payload to REST endpoint. Assert HTTP 400 Bad Request with structured JSON error details.
5. `test_r3_3_5_webclient_timeout_resilience`: Simulate latency on ML engine. Verify Java backend WebClient adapter handles timeout gracefully with proper exception mapping.

---

### 3.4 Requirement 4: Institutional Use Cases & Safety Engine Features

#### Feature R4.1: Municipal Traffic Safety Audits Module
1. `test_r4_1_1_generate_municipal_safety_audit`: Send audit request for target municipality. Assert HTTP 200 with complete audit report structure.
2. `test_r4_1_2_audit_spatial_risk_breakdown`: Verify audit report includes spatial risk index for each district/sub-division.
3. `test_r4_1_3_audit_top_contributing_factors`: Verify audit ranks top crash factors (e.g. speeding, wet pavement, dark unlit junctions).
4. `test_r4_1_4_audit_mined_association_recommendations`: Verify audit integrates FP-Growth mined association rules into actionable municipal safety policy recommendations.
5. `test_r4_1_5_audit_report_export_format`: Request audit report in export JSON / HTML format. Verify complete layout schema.

#### Feature R4.2: Blackspot Engineering Interventions Module
1. `test_r4_2_1_blackspot_composite_risk_ranking`: Query blackspots. Verify items are sorted by composite risk score (density * severity weight).
2. `test_r4_2_2_blackspot_countermeasure_mapping`: Verify system suggests tailored engineering interventions (e.g. signalized junction, street lighting, high-friction surfacing) based on dominant crash factors.
3. `test_r4_2_3_blackspot_cost_benefit_ratio`: Verify blackspot intervention details provide safety benefit ratio and estimated implementation cost index.
4. `test_r4_2_4_blackspot_drawer_detail_payload`: Request details for specific blackspot ID. Assert return of constituent crash IDs, temporal profile, and recommended action plan.
5. `test_r4_2_5_blackspot_polygon_hull_coordinates`: Verify blackspot detail includes valid closed convex hull coordinates for map overlay rendering.

#### Feature R4.3: Real-Time Emergency Telemetry Ticker (WebSocket STOMP)
1. `test_r4_3_1_stomp_connection_handshake`: Connect to WebSocket endpoint `/ws-traffic` using STOMP protocol. Assert successful connection handshake.
2. `test_r4_3_2_stomp_topic_subscription`: Subscribe to `/topic/live-telemetry`. Assert subscription confirmation frame received.
3. `test_r4_3_3_telemetry_event_stream_broadcast`: Trigger backend accident event broadcast. Assert subscriber receives telemetry JSON payload containing `event_id`, `latitude`, `longitude`, `severity`.
4. `test_r4_3_4_telemetry_payload_schema_validation`: Validate incoming WebSocket telemetry payload against defined STOMP message schema.
5. `test_r4_3_5_stomp_reconnection_handling`: Disconnect and reconnect WebSocket client. Verify state recovery and resume of topic messages.

#### Feature R4.4: Multi-Modal Route Safety Navigation
1. `test_r4_4_1_compute_safest_vs_fastest_route`: Post origin/destination to `/api/v1/routes/safest`. Assert return of two distinct paths: `safest_route` and `fastest_route`.
2. `test_r4_4_2_route_safety_weight_tuning`: Request route with `alpha=0.1, beta=0.9` (heavy safety preference) vs `alpha=0.9, beta=0.1` (heavy speed preference). Verify path node differences.
3. `test_r4_4_3_blackspot_avoidance_pathing`: Verify safest route path nodes do NOT traverse through high-risk blackspot spatial polygons.
4. `test_r4_4_4_route_summary_metrics_calculation`: Verify returned route includes total distance, estimated duration, risk score, and risk reduction percentage.
5. `test_r4_4_5_multi_modal_transport_profiles`: Request route for `travel_mode="bicycle"` vs `"car"`. Verify mode-specific risk weighting factors applied to path calculation.

---

## 4. Tier 2 Test Suite Design: Boundary & Corner Cases (>=5 Tests per Feature)

Tier 2 tests edge conditions, extreme inputs, null/empty states, boundary limits, and concurrent operations.

### 4.1 Requirement 1 Boundary & Corner Cases
1. `test_r1_boundary_1_empty_dataset_rendering`: Render dashboard when database is completely empty (0 incidents). Verify UI displays clean empty states without Javascript exceptions, `NaN`, or `Infinity`.
2. `test_r1_boundary_2_extreme_zoom_bounds`: Trigger map camera move to extreme zoom 0 (global) and zoom 22 (micro-building). Verify map container handles bounds cleanly.
3. `test_r1_boundary_3_rapid_filter_burst`: Send 50 rapid UI filter state updates in under 500ms. Verify state machine settles without deadlocks or unhandled promise rejections.
4. `test_r1_boundary_4_malformed_coordinate_resilience`: Pass incident object with `latitude=null` or `longitude=NaN` to map rendering component. Verify component skips invalid pin without crashing app.
5. `test_r1_boundary_5_overflow_text_truncation`: Pass 1,000-character string into location name or factor description. Verify UI table cells truncate cleanly without breaking layout geometry.

### 4.2 Requirement 2 Boundary & Corner Cases
1. `test_r2_boundary_1_sub_min_cluster_size_points`: Execute HDBSCAN on dataset containing only 3 points (where `min_cluster_size=5`). Assert return of 0 blackspots, all 3 labeled as noise (-1).
2. `test_r2_boundary_2_identical_coordinate_stacking`: Execute clustering on 200 incidents sharing the exact same `(lat, lon)` coordinate. Verify algorithm handles zero-distance variance without singular matrix exceptions.
3. `test_r2_boundary_3_exact_coordinate_extremes`: Ingest records at exact spatial limits (`lat=90.0`, `lat=-90.0`, `lon=180.0`, `lon=-180.0`). Verify parsing and GIS bounding check without index overflow.
4. `test_r2_boundary_4_leap_year_timezone_boundary`: Ingest incident timestamped `2024-02-29T23:59:59.999Z` and cross-timezone offsets (`+14:00`, `-11:00`). Verify UTC conversion precision.
5. `test_r2_boundary_5_climate_borderline_coordinate`: Ingest record on exact climate boundary line between tropical and sub-tropical zones. Verify predictable climate rule evaluation without unhandled logic exceptions.

### 4.3 Requirement 3 Boundary & Corner Cases
1. `test_r3_boundary_1_large_payload_stress`: Post 10,000 incident JSON records in a single REST request payload. Assert backend processes or rejects with payload size warning without heap memory crash.
2. `test_r3_boundary_2_ml_service_unreachable_fallback`: Shut down Python FastAPI process while Java backend is running. Query `/api/v1/analytics/blackspots`. Verify Java backend returns 503 Service Unavailable or fallback response cleanly.
3. `test_r3_boundary_3_concurrent_request_storm`: Send 100 concurrent HTTP GET requests to `/api/v1/incidents/`. Verify system maintains < 250ms average response time and 0 connection drops.
4. `test_r3_boundary_4_sql_script_injection_fuzzing`: Send malicious payload strings (`<script>alert(1)</script>`, `' OR '1'='1`) into query parameters. Verify request sanitization and non-execution.
5. `test_r3_boundary_5_high_precision_floating_points`: Submit lat/lon coordinates with 16 decimal places (`51.5073509128471234`). Verify floating point precision is preserved through backend JSON serialization.

### 4.4 Requirement 4 Boundary & Corner Cases
1. `test_r4_boundary_1_route_identical_start_end`: Submit route request where `startCoordinate == endCoordinate`. Verify system returns 0 distance, 0 travel time, and empty route segment list cleanly.
2. `test_r4_boundary_2_route_disconnected_graph`: Submit route request between origin and destination separated by disconnected graph edges (e.g. island vs mainland without bridge). Verify return of 404 Route Not Found error.
3. `test_r4_boundary_3_telemetry_high_frequency_burst`: Stream 500 WebSocket STOMP telemetry frames per second. Verify client buffer consumes messages without memory leakage or socket closure.
4. `test_r4_boundary_4_blackspot_zero_factor_match`: Request engineering interventions for a blackspot with no recorded contributing factors. Verify system returns default baseline road safety interventions.
5. `test_r4_boundary_5_safety_audit_zero_date_range`: Generate safety audit for a date range containing 0 incidents. Verify report renders zeroed statistics with explicit "No incident data recorded" notification.

---

## 5. Tier 3 Test Suite Design: Cross-Feature Combinations (Pairwise Coverage)

Tier 3 tests complex interactions across distinct subsystem boundaries using a pairwise integration matrix.

### Pairwise Feature Integration Matrix
| Combination | Subsystem A | Subsystem B | Target Integration Behavior |
|-------------|-------------|-------------|-----------------------------|
| **C1** | R1 (UI Map) | R2 (HDBSCAN Clustering) | Ingested data triggers HDBSCAN blackspots -> UI renders organic blackspot polygons with drawer stats. |
| **C2** | R1 (UI Form) | R3 (Backend/FastAPI REST) | User enters risk prediction inputs -> UI calls Spring Boot API -> backend invokes FastAPI ML engine -> UI displays risk score. |
| **C3** | R1 (UI Map) | R4 (Route Navigation) | User inputs origin/dest -> UI invokes safest route API -> map renders safest (green) vs fastest (blue) polyline overlays. |
| **C4** | R2 (Data Pipeline) | R3 (Backend Architecture)| Ingestion script sends tropical dataset -> Spring Boot calls `climate-validate` -> invalid snow records filtered before DB persist. |
| **C5** | R2 (Land-Bound Hotspots)| R4 (Blackspot Interventions)| Coastal land-bound blackspots generate automated engineering intervention plans with cost-benefit rankings. |
| **C6** | R3 (WebSocket STOMP) | R4 (Telemetry Ticker) | Backend event generator pushes accident event -> STOMP WebSocket broadcasts to client -> live ticker updates UI and alerts map. |
| **C7** | R2 (Multi-Country Schemas)| R4 (Municipal Audit) | Ingesting UK STATS19 or Ghana NRSA dataset drives municipal safety audit report generation for local transport authorities. |
| **C8** | R1 (UI Controls) | R4 (Telemetry + Camera Fly-to)| Live telemetry alert received on frontend -> user clicks alert -> map camera flies to crash coordinates and opens blackspot drawer. |

---

## 6. Tier 4 Test Suite Design: Real-World Institutional Application Scenarios

Tier 4 validates multi-step institutional workflows mimicking real-world deployment by transport authorities and emergency services.

### 6.1 Scenario 1: Municipal Traffic Safety Audit Workflow (Urban Planning Dept)
- **Step 1**: Ingest 1,500+ multi-source traffic accident records for Metropolitan Region.
- **Step 2**: Execute land-bound and climate-aware verification filters to guarantee zero ocean markers and realistic weather attributes.
- **Step 3**: Execute spatial density analysis (KDE heatmap) and HDBSCAN organic blackspot extraction.
- **Step 4**: Perform FP-Growth association mining to discover high-risk factor combinations (e.g. `{Wet Road + Night + Unlit Junction}`).
- **Step 5**: Generate comprehensive Municipal Traffic Safety Audit Report containing district risk breakdown, temporal trends, factor rankings, and exportable report JSON payload.

### 6.2 Scenario 2: Blackspot Engineering Intervention Workflow (Highway Authority)
- **Step 1**: Query top-ranked blackspots from `/api/v1/analytics/blackspots`.
- **Step 2**: Extract spatial bounding polygon and constituent crash history for target high-risk blackspot.
- **Step 3**: Analyze dominant contributing crash factor profile (e.g. 70% night crashes, 55% junction collisions).
- **Step 4**: Compute recommended engineering counter-measures (e.g., LED Street Lighting upgrade, High-Friction Surface Dressing, Signalized Roundabout conversion).
- **Step 5**: Calculate projected risk reduction percentage and cost-benefit ratio for capital budget allocation.

### 6.3 Scenario 3: Emergency Route Navigation & Dynamic Rerouting Workflow (Fleet Management)
- **Step 1**: Dispatch vehicle from Origin A to Destination B.
- **Step 2**: Query `/api/v1/routes/safest` with `alpha=0.3` (speed weighting) and `beta=0.7` (safety weighting).
- **Step 3**: Verify route solver bypasses primary blackspot zones and returns safest polyline path with risk comparison metrics.
- **Step 4**: Simulate live emergency telemetry crash alert mid-route along primary path.
- **Step 5**: Receive real-time STOMP WebSocket notification and dynamically re-calculate alternative safe bypass route.

### 6.4 Scenario 4: Real-Time Telemetry Stream & Control Center Workflow (Traffic Management)
- **Step 1**: Establish persistent STOMP WebSocket connection to `/ws-traffic`.
- **Step 2**: Subscribe to `/topic/live-telemetry` stream.
- **Step 3**: Stream batch of live telemetry crash events into system.
- **Step 4**: Verify real-time UI ticker update, map pin alert flash, and dynamic risk score recalculation.
- **Step 5**: Validate event persistence and historical log retention in backend repository.

---

## 7. Implementation Guidelines & Execution Plan for Implementer Subagent

### 7.1 Target File Locations
The implementer subagent will create the following opaque-box E2E test files in `tests/e2e/`:
- `tests/e2e/conftest.py`
- `tests/e2e/requirements.txt`
- `tests/e2e/test_tier1_feature_coverage.py`
- `tests/e2e/test_tier2_boundary_corner.py`
- `tests/e2e/test_tier3_pairwise_combos.py`
- `tests/e2e/test_tier4_institutional_scenarios.py`
- `tests/e2e/run_e2e_tests.py`

### 7.2 Verification Commands
To execute and verify the E2E test suite:
```bash
# 1. Install E2E dependencies
pip install -r tests/e2e/requirements.txt

# 2. Run complete E2E test suite with pytest
pytest tests/e2e/ -v --junitxml=tests/e2e/results.xml

# 3. Or run via runner orchestrator
python tests/e2e/run_e2e_tests.py
```
