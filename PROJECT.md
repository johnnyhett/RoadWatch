# Project: RoadWatch (Metropolitan Traffic Accident Pattern Recognition & Road Safety Engine)

## Architecture
- **Frontend**: Next.js 14/15 TypeScript application (`frontend/`), Tailwind CSS, Leaflet/Mapbox interactive visualization, responsive dark glassmorphism dashboard UI.
- **Backend API**: Java 21 Spring Boot 3.3 Hexagonal/Clean Architecture (`backend/`), REST controllers, domain ports/adapters, data models.
- **ML Engine**: Python 3.12 FastAPI microservice (`ml-engine/`), HDBSCAN spatial blackspot clustering, land-bound coordinate verification, climate rule engines.
- **Data Ingestion**: Data generation/ingestion pipeline (`data/`), support for Ghana NRSA, UK DfT STATS19, US NHTSA FARS, EU CARE schemas.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | E2E Testing Suite | Opaque-box requirement-driven testing track (Tiers 1-4) | None | PLANNED |
| M1 | UI/UX & Interactive Design | High-density dashboard, dark glassmorphism, responsive UI | None | PLANNED |
| M2 | Authentic Data & Spatial Ingestion | Real open data schemas, HDBSCAN 6-pt clustering, land bounds, climate rules | None | PLANNED |
| M3 | Backend & API Audit | Java Spring Boot Hexagonal refactoring, Python FastAPI schema sync, remove mocks | None | PLANNED |
| M4 | Institutional Use Cases | Safety audits, Blackspot interventions, Telemetry ticker, Route navigation | M1, M2, M3 | PLANNED |
| M5 | Health Audit, Verification & Git Push | Full codebase cleanup, 100% E2E pass, Tier 5 hardening, push to GitHub | M0, M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Frontend ↔ Backend REST API
- `GET /api/accidents`: Query filtered accident incidents.
- `GET /api/blackspots`: Spatial blackspots extracted from ML engine.
- `POST /api/analysis/safety-audit`: Municipal traffic safety audit report.
- `POST /api/navigation/safe-route`: Multi-modal route safety calculation.
- `GET /api/telemetry/live`: Real-time emergency telemetry ticker stream.

### Backend ↔ ML Engine REST API
- `POST /api/v1/ml/cluster`: HDBSCAN spatial clustering on lat/lon coordinates.
- `POST /api/v1/ml/classify-risk`: Risk assessment model inference.
- `POST /api/v1/ml/climate-validate`: Enforce tropical climate rules & land boundaries.

## Code Layout
- `frontend/`: Next.js TypeScript web application.
- `backend/`: Java Spring Boot 3.3 microservice (`src/main/java/...`, `src/test/java/...`).
- `ml-engine/`: Python FastAPI service (`main.py`, `app/...`).
- `data/`: Ingestion pipelines and datasets (`synthetic_traffic_accidents.json`, `generate_dataset.py`).
