## 2026-08-04T16:44:57Z

<USER_REQUEST>
You are a Worker subagent in the RoadWatch project.
Your assigned working directory for agent metadata is: c:\Users\LMAA-0001\Desktop\GitHub PROJECTS\Traffic-Accident-Pattern-Recognition-System\.agents\worker_m2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task: Implement Milestone M2 (Authentic Data Sources, Spatial Clustering & Rules Engine).

Specific Requirements (R2 & Acceptance Criteria):
1. Ingestion Pipeline & Schemas:
   - Enhance data/generate_dataset.py and data/ open-data modules to support authentic schemas for:
     - Ghana NRSA (National Road Safety Authority)
     - UK DfT STATS19
     - US NHTSA FARS
     - EU CARE
2. Land-Bound Coordinate Boundaries:
   - Implement coastal coordinate bound filtering to enforce land-only incident placement (zero ocean markers for coastal cities like Accra, London, New York).
3. Tropical Climate Rules:
   - Enforce climate rules in data pipeline & ML engine: prohibit unrealistic "Snow" or "Ice" weather/road factors for tropical/African locations (e.g. Ghana/Accra coordinates).
4. Organic 6-Point HDBSCAN Convex Hull Clustering:
   - Update ml-engine/app/analytics/clustering.py to extract organic 6-point convex hull polygons for spatial blackspots (no artificial grid stripes). Ensure the bounding convex hull returns exactly 6 boundary vertices representing the blackspot perimeter.
5. Document your implementation and build/test verification results in c:\Users\LMAA-0001\Desktop\GitHub PROJECTS\Traffic-Accident-Pattern-Recognition-System\.agents\worker_m2\handoff.md.
6. Use send_message to report completion back to the parent orchestrator.
</USER_REQUEST>
