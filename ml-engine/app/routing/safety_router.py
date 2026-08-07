import networkx as nx
import numpy as np
from math import radians, cos, sin, asin, sqrt

# Radius in km within which a blackspot raises the risk of a road node.
BLACKSPOT_INFLUENCE_KM = 1.0

# Caps the per-node risk multiplier so a single dense cluster cannot make the
# safest route arbitrarily long.
MAX_RISK_MULTIPLIER = 10.0


def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


class SafetyRouter:
    def __init__(self):
        self.graph = nx.Graph()
        self.blackspots = []
        self.grid_size = 20

    def haversine(self, lon1, lat1, lon2, lat2):
        return haversine(lon1, lat1, lon2, lat2)

    def build_graph(self, blackspots, grid_size=20):
        """
        Record the blackspots used to weight road risk.

        The routable grid itself is built per request in :meth:`calculate_route`,
        because a graph pinned to one fixed bounding box can only route within
        that box -- requests anywhere else silently snap to its nearest corner
        and return a path in the wrong city.
        """
        self.blackspots = [b for b in (blackspots or []) if self._blackspot_center(b) is not None]
        self.grid_size = grid_size

    @staticmethod
    def _blackspot_center(blackspot):
        center = blackspot.get('center') if isinstance(blackspot, dict) else None
        if not center or len(center) < 2:
            return None
        try:
            return float(center[0]), float(center[1])
        except (TypeError, ValueError):
            return None

    def _node_risk(self, lat, lng):
        """Risk multiplier at a point: 1.0 on clear road, higher near blackspots."""
        risk = 1.0
        for bs in self.blackspots:
            center = self._blackspot_center(bs)
            if center is None:
                continue
            bs_lat, bs_lng = center
            dist = haversine(lng, lat, bs_lng, bs_lat)
            if dist < BLACKSPOT_INFLUENCE_KM:
                severity = float(bs.get('avg_severity') or 3.0)
                count = float(bs.get('incident_count') or 1)
                # Fatal-leaning, denser clusters weigh more; falls off with distance.
                intensity = (5.0 - min(max(severity, 1.0), 4.0)) * float(np.log1p(count))
                risk += (1.0 - dist / BLACKSPOT_INFLUENCE_KM) * intensity
        return float(min(risk, MAX_RISK_MULTIPLIER))

    def _build_local_grid(self, origin, destination, grid_size=20):
        """Build a routable lattice spanning the requested origin/destination corridor."""
        lat_lo, lat_hi = sorted((origin[0], destination[0]))
        lng_lo, lng_hi = sorted((origin[1], destination[1]))

        # Pad so the corridor has room to detour around blackspots.
        lat_pad = max((lat_hi - lat_lo) * 0.35, 0.01)
        lng_pad = max((lng_hi - lng_lo) * 0.35, 0.01)

        lats = np.linspace(lat_lo - lat_pad, lat_hi + lat_pad, grid_size)
        lngs = np.linspace(lng_lo - lng_pad, lng_hi + lng_pad, grid_size)

        graph = nx.Graph()
        for i in range(grid_size):
            for j in range(grid_size):
                lat, lng = float(lats[i]), float(lngs[j])
                graph.add_node((i, j), pos=(lat, lng), risk=self._node_risk(lat, lng))

        # 8-way connectivity. With only N/S and E/W edges every path is forced
        # into axis-aligned staircases, which render as unnatural right angles
        # and overstate distance by up to ~41% on diagonal corridors.
        for i in range(grid_size):
            for j in range(grid_size):
                for di, dj in ((1, 0), (0, 1), (1, 1), (1, -1)):
                    ni, nj = i + di, j + dj
                    if not (0 <= ni < grid_size and 0 <= nj < grid_size):
                        continue
                    a, b = (i, j), (ni, nj)
                    lat_a, lng_a = graph.nodes[a]['pos']
                    lat_b, lng_b = graph.nodes[b]['pos']
                    d = haversine(lng_a, lat_a, lng_b, lat_b)
                    risk = (graph.nodes[a]['risk'] + graph.nodes[b]['risk']) / 2.0
                    graph.add_edge(a, b, distance=d, risk=risk)
        return graph

    def find_nearest_node(self, lat, lng, graph=None):
        graph = graph if graph is not None else self.graph
        best_node = None
        min_dist = float('inf')
        for node, data in graph.nodes(data=True):
            n_lat, n_lng = data['pos']
            dist = haversine(lng, lat, n_lng, n_lat)
            if dist < min_dist:
                min_dist = dist
                best_node = node
        return best_node

    def calculate_route(self, origin, destination, alpha=0.5, beta=0.5):
        if not origin or not destination or len(origin) < 2 or len(destination) < 2:
            return None, None

        try:
            origin = (float(origin[0]), float(origin[1]))
            destination = (float(destination[0]), float(destination[1]))
        except (TypeError, ValueError):
            return None, None

        # A route to the point you are already standing on has no length; routing
        # it through the lattice would report the detour to the nearest node.
        if haversine(origin[1], origin[0], destination[1], destination[0]) < 1e-6:
            degenerate = {"path": [list(origin)], "total_risk": 0.0, "distance_km": 0.0}
            return degenerate, dict(degenerate)

        graph = self._build_local_grid(origin, destination, self.grid_size)
        self.graph = graph

        orig_node = self.find_nearest_node(origin[0], origin[1], graph)
        dest_node = self.find_nearest_node(destination[0], destination[1], graph)

        if orig_node is None or dest_node is None:
            return None, None

        def safe_weight(u, v, d):
            # Distance-scaled so alpha (travel cost) and beta (risk exposure)
            # stay in the same unit and neither term can dwarf the other.
            return d['distance'] * (alpha + beta * d['risk'])

        def fast_weight(u, v, d):
            return d['distance']

        dest_lat, dest_lng = graph.nodes[dest_node]['pos']

        def heuristic_factory(scale):
            def h(node, _target):
                lat, lng = graph.nodes[node]['pos']
                return haversine(lng, lat, dest_lng, dest_lat) * scale
            return h

        try:
            safe_path = nx.astar_path(graph, orig_node, dest_node, heuristic=heuristic_factory(alpha), weight=safe_weight)
            fast_path = nx.astar_path(graph, orig_node, dest_node, heuristic=heuristic_factory(1.0), weight=fast_weight)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None, None

        def format_path(path):
            coords = [list(graph.nodes[n]['pos']) for n in path]
            # Anchor the polyline to the coordinates the caller actually asked for.
            coords = [list(origin)] + coords + [list(destination)]
            dist = sum(
                haversine(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0])
                for i in range(len(coords) - 1)
            )
            risk = sum(
                graph[path[i]][path[i + 1]]['risk'] * graph[path[i]][path[i + 1]]['distance']
                for i in range(len(path) - 1)
            )
            return {"path": coords, "total_risk": round(float(risk), 4), "distance_km": round(float(dist), 4)}

        return format_path(safe_path), format_path(fast_path)
