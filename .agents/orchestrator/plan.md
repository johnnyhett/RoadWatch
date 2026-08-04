# Master Execution Plan — RoadWatch Engine

## Overview
RoadWatch is a Metropolitan Traffic Accident Pattern Recognition & Road Safety Engine comprising:
1. Frontend dashboard (Next.js TypeScript, Tailwind CSS, Mapbox/Leaflet spatial rendering).
2. Backend API microservice (Java 21 Spring Boot 3.3 Hexagonal/Clean Architecture).
3. ML Microservice (Python 3.12 FastAPI, HDBSCAN clustering, spatial blackspot analysis).
4. Real-world / Open-data datasets (Ghana NRSA, UK STATS19, US FARS, EU CARE).

## Milestones & Work Breakdown

### E2E Testing Track (Parallel)
- **M0: E2E Testing Suite & Infra**: Requirement-driven opaque-box test suite (Tiers 1-4 coverage, published via `TEST_READY.md`).

### Implementation Track
- **M1: UI/UX & Interactive Design Upgrade (R1)**:
  - Responsive high-density safety intelligence interface.
  - Dark glassmorphism styling, fluid transitions.
  - Camera movement controls, non-overlapping spatial controls.
  - Zero TypeScript / ESLint compilation errors (`npm run build`).

- **M2: Authentic Data Sources & Ingestion Pipeline (R2)**:
  - Open data schemas (Ghana NRSA, UK DfT STATS19, US NHTSA FARS, EU CARE).
  - HDBSCAN spatial clustering (organic 6-point spatial blackspots, no grid artifacts).
  - Land-bound coordinate boundaries (coastal filtering, zero ocean markers).
  - Climate-aware environmental factors (tropical climate rules prohibiting Ice/Snow in African locations).

- **M3: Backend Architecture & API Audit (R3)**:
  - Java 21 Spring Boot 3.3 Hexagonal Architecture audit and hardening.
  - Python FastAPI ML engine API refactoring & schema alignment.
  - Eliminate broken mock fallbacks, unwired endpoints, missing CORS/DTO validation.

- **M4: Institutional Use Cases & Safety Features (R4)**:
  - Municipal Traffic Safety Audits module.
  - Blackspot Engineering Interventions module.
  - Real-Time Emergency Telemetry Ticker.
  - Multi-Modal Route Safety Navigation.

- **M5: Codebase Health, E2E Verification & Remote Repository Push (R5 & Acceptance)**:
  - Full codebase audit (orphaned files, broken imports, missing types, unhandled exceptions).
  - Pass 100% of E2E test suite (Tiers 1-4).
  - Adversarial Coverage Hardening (Tier 5).
  - Push all clean code & docs to `https://github.com/johnnyhett/RoadWatch`.

## Execution Topology
For each milestone:
1. Dispatch Explorer(s) to analyze requirements and current codebase.
2. Dispatch Worker to implement solution with domain skills.
3. Dispatch Reviewers to verify build, tests, layout, and functionality.
4. Dispatch Challengers to run stress tests / edge cases.
5. Dispatch Forensic Auditor to execute static analysis and integrity validation (BINARY VETO).
6. Gate Evaluation: ALL pass -> Milestone Complete.
