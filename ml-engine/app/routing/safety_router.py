import networkx as nx
import numpy as np
from math import radians, cos, sin, asin, sqrt

class SafetyRouter:
    def __init__(self):
        self.graph = nx.Graph()
        
    def haversine(self, lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a)) 
        r = 6371 # Radius of earth in kilometers
        return c * r
        
    def build_graph(self, blackspots, grid_size=20):
        # A simple grid-based road network representing the area
        lat_min, lat_max = 51.45, 51.55
        lng_min, lng_max = -0.20, 0.05
        
        lats = np.linspace(lat_min, lat_max, grid_size)
        lngs = np.linspace(lng_min, lng_max, grid_size)
        
        for i in range(grid_size):
            for j in range(grid_size):
                node_id = (i, j)
                lat, lng = lats[i], lngs[j]
                
                # Base risk is low
                risk = 1.0
                
                for bs in blackspots:
                    bs_lat, bs_lng = bs['center']
                    dist = self.haversine(lng, lat, bs_lng, bs_lat)
                    if dist < 1.0: # within 1km
                        risk += (1.0 - dist) * bs['risk_score'] * 0.1
                
                self.graph.add_node(node_id, pos=(lat, lng), risk=risk)
                
        # Add edges
        for i in range(grid_size):
            for j in range(grid_size):
                if i < grid_size - 1:
                    d = self.haversine(lngs[j], lats[i], lngs[j], lats[i+1])
                    r1 = self.graph.nodes[(i, j)]['risk']
                    r2 = self.graph.nodes[(i+1, j)]['risk']
                    self.graph.add_edge((i, j), (i+1, j), distance=d, risk=(r1+r2)/2)
                if j < grid_size - 1:
                    d = self.haversine(lngs[j], lats[i], lngs[j+1], lats[i])
                    r1 = self.graph.nodes[(i, j)]['risk']
                    r2 = self.graph.nodes[(i, j+1)]['risk']
                    self.graph.add_edge((i, j), (i, j+1), distance=d, risk=(r1+r2)/2)
                    
    def find_nearest_node(self, lat, lng):
        best_node = None
        min_dist = float('inf')
        for node, data in self.graph.nodes(data=True):
            n_lat, n_lng = data['pos']
            dist = self.haversine(lng, lat, n_lng, n_lat)
            if dist < min_dist:
                min_dist = dist
                best_node = node
        return best_node

    def calculate_route(self, origin, destination, alpha=0.5, beta=0.5):
        orig_node = self.find_nearest_node(origin[0], origin[1])
        dest_node = self.find_nearest_node(destination[0], destination[1])
        
        if not orig_node or not dest_node:
            return None, None
            
        def safe_weight(u, v, d):
            return alpha * d['distance'] + beta * d['risk']
            
        def fast_weight(u, v, d):
            return d['distance']
            
        try:
            safe_path = nx.astar_path(self.graph, orig_node, dest_node, weight=safe_weight)
            fast_path = nx.astar_path(self.graph, orig_node, dest_node, weight=fast_weight)
            
            def format_path(path):
                coords = [self.graph.nodes[n]['pos'] for n in path]
                dist = sum(self.graph[path[i]][path[i+1]]['distance'] for i in range(len(path)-1))
                risk = sum(self.graph[path[i]][path[i+1]]['risk'] for i in range(len(path)-1))
                return {"path": coords, "total_risk": float(risk), "distance_km": float(dist)}
                
            return format_path(safe_path), format_path(fast_path)
        except nx.NetworkXNoPath:
            return None, None
