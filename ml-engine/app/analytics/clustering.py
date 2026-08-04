import numpy as np
import hdbscan
from pyproj import Proj, transform, Transformer
import pandas as pd

class BlackspotDetector:
    def __init__(self, min_cluster_size=5):
        self.min_cluster_size = min_cluster_size
        self.transformer_to_utm = Transformer.from_crs("epsg:4326", "epsg:32630", always_xy=True)
        self.transformer_to_wgs = Transformer.from_crs("epsg:32630", "epsg:4326", always_xy=True)
        
    def detect(self, incidents: list, min_cluster_size=5):
        if not incidents:
            return {"blackspots": []}
            
        df = pd.DataFrame(incidents)
        coords = np.array([self.transformer_to_utm.transform(lng, lat) for lng, lat in zip(df['longitude'], df['latitude'])])
        
        clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, metric='euclidean')
        labels = clusterer.fit_predict(coords)
        
        blackspots = []
        for cluster_id in set(labels):
            if cluster_id == -1: continue # Noise
            
            mask = labels == cluster_id
            cluster_data = df[mask]
            cluster_coords = coords[mask]
            
            center_utm = np.mean(cluster_coords, axis=0)
            center_lng, center_lat = self.transformer_to_wgs.transform(center_utm[0], center_utm[1])
            
            bounds = []
            for c in cluster_coords:
                lng, lat = self.transformer_to_wgs.transform(c[0], c[1])
                bounds.append([lat, lng])
                
            avg_severity = cluster_data['severity'].mean()
            
            factors = {}
            for f_list in cluster_data['contributing_factors']:
                for f in f_list:
                    factors[f] = factors.get(f, 0) + 1
                    
            risk_score = float(len(cluster_data) * (5 - avg_severity))
            
            blackspots.append({
                "cluster_id": int(cluster_id),
                "center": [float(center_lat), float(center_lng)],
                "bounds": bounds,
                "incident_count": len(cluster_data),
                "avg_severity": float(avg_severity),
                "risk_score": float(risk_score),
                "primary_factors": factors
            })
            
        return {"blackspots": blackspots}
