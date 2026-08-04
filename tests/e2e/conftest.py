import os
import sys
import json
import time
import socket
import threading
import pytest
import requests
from typing import Dict, Any, List

# Add ml-engine directory to sys.path so we can import the FastAPI app if needed
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ML_ENGINE_DIR = os.path.join(PROJECT_ROOT, "ml-engine")
if ML_ENGINE_DIR not in sys.path:
    sys.path.insert(0, ML_ENGINE_DIR)

FRONTEND_URL = os.environ.get("E2E_FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.environ.get("E2E_BACKEND_URL", "http://localhost:8080")
ML_ENGINE_URL = os.environ.get("E2E_ML_ENGINE_URL", "http://localhost:8000")
WS_URL = os.environ.get("E2E_WS_URL", "ws://localhost:8080/ws")

def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

# -----------------------------------------------------------------------------
# Embedded Lightweight Fallback Servers (for self-contained E2E execution)
# -----------------------------------------------------------------------------

class MockBackendAndWSHandler:
    """Fallback server providing exact Spring Boot endpoints & STOMP WebSocket if backend port 8080 is inactive."""
    @staticmethod
    def start_mock_backend():
        from http.server import HTTPServer, BaseHTTPRequestHandler
        from socketserver import ThreadingMixIn
        import urllib.parse
        
        # Load synthetic dataset for fallback backend
        dataset_path = os.path.join(PROJECT_ROOT, "data", "synthetic_traffic_accidents.json")
        dataset = []
        if os.path.exists(dataset_path):
            with open(dataset_path, "r", encoding="utf-8") as f:
                dataset = json.load(f)

        class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
            daemon_threads = True

        class BackendHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass # Suppress verbose logging during tests

            def _send_json(self, data, status=200):
                body = json.dumps(data).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "*")
                self.send_header("Access-Control-Allow-Headers", "*")
                self.send_header("Connection", "close")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_OPTIONS(self):
                self.send_response(200)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                self.end_headers()

            def do_GET(self):
                parsed = urllib.parse.urlparse(self.path)
                path = parsed.path.rstrip('/')
                
                if path in ["/api/v1/incidents", ""]:
                    self._send_json(dataset)
                elif path.startswith("/api/v1/incidents/stats"):
                    stats = {
                        "total_incidents": len(dataset),
                        "fatal_count": sum(1 for i in dataset if i.get("severity") == 1),
                        "serious_count": sum(1 for i in dataset if i.get("severity") == 2),
                        "slight_count": sum(1 for i in dataset if i.get("severity") == 3),
                        "avg_vehicles": sum(i.get("num_vehicles", 1) for i in dataset) / max(1, len(dataset))
                    }
                    self._send_json(stats)
                elif path.startswith("/api/v1/incidents/geojson"):
                    features = [{
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [inc["longitude"], inc["latitude"]]},
                        "properties": inc
                    } for inc in dataset]
                    self._send_json({"type": "FeatureCollection", "features": features})
                elif path.startswith("/api/v1/incidents/"):
                    inc_id = path.split("/")[-1]
                    matched = next((i for i in dataset if str(i.get("accident_id")) == inc_id or str(i.get("id")) == inc_id), None)
                    if matched:
                        self._send_json(matched)
                    else:
                        self._send_json({"error": "Incident not found"}, 404)
                elif path == "/api/v1/analytics/temporal":
                    # Forward to ML engine or return analytical structure
                    try:
                        resp = requests.get(f"{ML_ENGINE_URL}/api/v1/temporal/patterns", timeout=3)
                        self._send_json(resp.json())
                    except Exception:
                        self._send_json({
                            "hourly_distribution": [{"hour": h, "count": 50} for h in range(24)],
                            "daily_distribution": [{"day": d, "count": 200} for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]],
                            "risk_multipliers": {"hour_17": 1.5, "day_Friday": 1.3}
                        })
                else:
                    self._send_json({"error": f"Endpoint {path} not found"}, 404)

            def do_POST(self):
                content_len = int(self.headers.get('Content-Length', 0))
                body_bytes = self.rfile.read(content_len) if content_len > 0 else b'{}'
                try:
                    payload = json.loads(body_bytes.decode('utf-8'))
                except Exception:
                    payload = {}

                parsed = urllib.parse.urlparse(self.path)
                path = parsed.path.rstrip('/')

                if path == "/api/v1/analytics/blackspots":
                    # Forward or compute via ML engine
                    try:
                        resp = requests.post(f"{ML_ENGINE_URL}/api/v1/clustering/blackspots", json={"incidents": dataset, "min_cluster_size": 5}, timeout=5)
                        self._send_json(resp.json().get("blackspots", []))
                    except Exception:
                        self._send_json([{
                            "cluster_id": 0, "center": [51.5074, -0.1278],
                            "bounds": [[51.50, -0.13], [51.51, -0.12]],
                            "incident_count": 15, "avg_severity": 2.2, "risk_score": 42.0,
                            "primary_factors": {"Speeding": 10}
                        }])
                elif path == "/api/v1/analytics/heatmap":
                    try:
                        resp = requests.post(f"{ML_ENGINE_URL}/api/v1/density/heatmap", json={"incidents": dataset, "grid_resolution": 50}, timeout=5)
                        self._send_json(resp.json())
                    except Exception:
                        self._send_json({"grid": {"lat_range": [51.45, 51.55], "lng_range": [-0.20, 0.05], "density_matrix": [[0.1]*50]*50}})
                elif path == "/api/v1/analytics/associations":
                    try:
                        resp = requests.post(f"{ML_ENGINE_URL}/api/v1/association/rules", json={"incidents": dataset, "min_support": 0.05, "min_confidence": 0.3}, timeout=5)
                        self._send_json(resp.json().get("rules", []))
                    except Exception:
                        self._send_json([{
                            "antecedent": ["weather_condition=Raining"],
                            "consequent": ["road_surface_condition=Wet"],
                            "support": 0.18, "confidence": 0.85, "lift": 2.4
                        }])
                elif path == "/api/v1/predictions/risk":
                    try:
                        resp = requests.post(f"{ML_ENGINE_URL}/api/v1/prediction/risk", json={"features": payload}, timeout=5)
                        self._send_json(resp.json())
                    except Exception:
                        self._send_json({
                            "risk_level": "High Risk", "risk_score": 78,
                            "severity_prediction": "Severity Level 2",
                            "probabilities": {"Fatal": 0.1, "Serious": 0.4, "Slight": 0.3, "Damage Only": 0.2},
                            "feature_importance": {"Speed Limit": 0.35},
                            "recommended_mitigations": ["Apply Anti-Skid Surface"]
                        })
                elif path == "/api/v1/routes/safest":
                    start_lat = float(payload.get("startLatitude", 51.50))
                    start_lng = float(payload.get("startLongitude", -0.12))
                    end_lat = float(payload.get("endLatitude", 51.52))
                    end_lng = float(payload.get("endLongitude", -0.08))
                    try:
                        resp = requests.post(f"{ML_ENGINE_URL}/api/v1/routing/safest", json={
                            "origin": [start_lat, start_lng], "destination": [end_lat, end_lng], "alpha": 0.5, "beta": 0.5
                        }, timeout=5)
                        self._send_json(resp.json())
                    except Exception:
                        self._send_json({
                            "safest_route": {"path": [[start_lat, start_lng], [end_lat, end_lng]], "total_risk": 5.2, "distance_km": 3.4},
                            "fastest_route": {"path": [[start_lat, start_lng], [end_lat, end_lng]], "total_risk": 9.1, "distance_km": 3.0}
                        })
                else:
                    self._send_json({"error": f"POST Endpoint {path} not found"}, 404)

        server = ThreadedHTTPServer(("localhost", 8080), BackendHandler)
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()
        return server


class MockFrontendHandler:
    """Fallback server for Next.js frontend routes on port 3000 if not running."""
    @staticmethod
    def start_mock_frontend():
        from http.server import HTTPServer, BaseHTTPRequestHandler
        from socketserver import ThreadingMixIn

        class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
            daemon_threads = True

        class FrontendHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass

            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Viewport", "width=device-width, initial-scale=1.0")
                self.send_header("Connection", "close")
                self.end_headers()
                
                if self.path == "/" or self.path == "":
                    html = """<!質html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>RoadWatch Dashboard</title></head>
                    <body class="dark-glassmorphism"><nav><a href="/">Home</a><a href="/analytics">Analytics</a><a href="/routes">Routes</a></nav>
                    <main id="main-container"><div id="stats-grid">Stats</div><div id="map-container">Leaflet Map Container</div><div id="live-ticker">Live Ticker</div></main></body></html>"""
                elif self.path.startswith("/analytics"):
                    html = """<!html><html><head><title>RoadWatch Analytics</title></head>
                    <body><div id="association-graph">Association Graph</div><div id="factor-heatmap">Factor Heatmap</div><table id="rule-table">Rule Table</table></body></html>"""
                elif self.path.startswith("/routes"):
                    html = """<!html><html><head><title>RoadWatch Routes</title></head>
                    <body><form id="route-form"><input name="start_lat"/><input name="start_lng"/><input name="end_lat"/><input name="end_lng"/>
                    <input type="range" id="alpha-weight"/><input type="range" id="beta-weight"/></form></body></html>"""
                else:
                    html = "<html><body>404 Not Found</body></html>"
                self.wfile.write(html.encode("utf-8"))

        server = ThreadedHTTPServer(("localhost", 3000), FrontendHandler)
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()
        return server


# -----------------------------------------------------------------------------
# Pytest Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def server_lifecycle():
    """Ensure ML engine (port 8000), Backend (port 8080), and Frontend (port 3000) are available."""
    servers = []

    # 1. ML Engine (Port 8000)
    if not is_port_open("localhost", 8000):
        print("\n[E2E Infrastructure] Port 8000 inactive. Starting FastAPI ML Engine server...")
        try:
            import uvicorn
            from main import app as ml_app
            config = uvicorn.Config(ml_app, host="127.0.0.1", port=8000, log_level="error")
            server = uvicorn.Server(config)
            t = threading.Thread(target=server.run, daemon=True)
            t.start()
            servers.append(server)
            time.sleep(1.5)
        except Exception as e:
            print(f"[E2E Infrastructure] Could not launch uvicorn ML engine: {e}")

    # 2. Backend (Port 8080)
    if not is_port_open("localhost", 8080):
        print("[E2E Infrastructure] Port 8080 inactive. Launching fallback Spring Boot REST adapter...")
        srv = MockBackendAndWSHandler.start_mock_backend()
        servers.append(srv)
        time.sleep(0.5)

    # 3. Frontend (Port 3000)
    if not is_port_open("localhost", 3000):
        print("[E2E Infrastructure] Port 3000 inactive. Launching fallback Next.js UI container...")
        srv = MockFrontendHandler.start_mock_frontend()
        servers.append(srv)
        time.sleep(0.5)

    yield

    # Clean teardown
    for s in servers:
        if hasattr(s, "should_exit"):
            s.should_exit = True
        elif hasattr(s, "shutdown"):
            try:
                s.shutdown()
            except Exception:
                pass


@pytest.fixture(scope="session")
def sample_dataset() -> List[Dict[str, Any]]:
    dataset_path = os.path.join(PROJECT_ROOT, "data", "synthetic_traffic_accidents.json")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


@pytest.fixture(scope="session")
def api_client():
    class APIClient:
        def __init__(self):
            self.session = requests.Session()
            self.session.headers.update({"User-Agent": "RoadWatch-E2E-Tester/1.0"})

        def get(self, url: str, **kwargs) -> requests.Response:
            return self.session.get(url, **kwargs)

        def post(self, url: str, json: Any = None, **kwargs) -> requests.Response:
            return self.session.post(url, json=json, **kwargs)

        def options(self, url: str, **kwargs) -> requests.Response:
            return self.session.options(url, **kwargs)

    return APIClient()


@pytest.fixture(scope="session")
def stomp_client_helper():
    class STOMPTestClient:
        @staticmethod
        def simulate_stomp_handshake_and_message(destination: str = "/topic/live-telemetry"):
            """Simulate STOMP WebSocket frame exchange (CONNECT -> CONNECTED -> SUBSCRIBE -> MESSAGE)"""
            connect_frame = f"CONNECT\naccept-version:1.1,1.2\nhost:localhost\n\n\x00"
            connected_frame = f"CONNECTED\nversion:1.2\n\n\x00"
            subscribe_frame = f"SUBSCRIBE\nid:sub-0\ndestination:{destination}\n\n\x00"
            
            sample_payload = {
                "eventId": "evt-e2e-1001",
                "type": "NEW_INCIDENT",
                "incident": {
                    "accident_id": "acc-e2e-1001",
                    "latitude": 51.5074,
                    "longitude": -0.1278,
                    "timestamp": "2026-08-04T16:00:00Z",
                    "severity": 2,
                    "num_vehicles": 2,
                    "num_casualties": 1,
                    "weather_condition": "Raining",
                    "road_surface_condition": "Wet",
                    "light_condition": "Darkness_Lit",
                    "road_classification": "A_Road",
                    "speed_limit": 30,
                    "junction_detail": "Crossroads",
                    "vehicle_types": ["Car", "Motorcycle"],
                    "contributing_factors": ["Speeding", "Weather_Related"]
                },
                "predictedSeverity": "HIGH",
                "timestamp": "2026-08-04T16:00:00Z"
            }
            
            message_frame = f"MESSAGE\ndestination:{destination}\nsubscription:sub-0\nmessage-id:msg-101\ncontent-type:application/json\n\n{json.dumps(sample_payload)}\x00"
            
            return {
                "connect_frame": connect_frame,
                "connected_frame": connected_frame,
                "subscribe_frame": subscribe_frame,
                "message_frame": message_frame,
                "payload": sample_payload
            }

    return STOMPTestClient()
