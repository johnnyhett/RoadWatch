import numpy as np
import hdbscan
import pandas as pd
from typing import List, Dict, Any
from scipy.spatial import ConvexHull

class BlackspotDetector:
    def __init__(self, min_cluster_size=5):
        self.min_cluster_size = min_cluster_size

    def compute_organic_6pt_hull(self, coords: np.ndarray) -> List[List[float]]:
        """
        Extracts an organic 6-point convex hull polygon representing the cluster boundary perimeter.
        Guarantees returning exactly 6 boundary vertices [lat, lng].
        """
        coords = np.unique(coords, axis=0)
        n = len(coords)
        centroid = np.mean(coords, axis=0)

        # Fallback for fewer than 3 unique points
        if n < 3:
            r = 0.002
            angles = np.linspace(0, 2 * np.pi, 6, endpoint=False)
            return [[float(centroid[0] + r * np.cos(a)), float(centroid[1] + r * np.sin(a))] for a in angles]

        try:
            hull = ConvexHull(coords)
            hull_pts = coords[hull.vertices]
        except Exception:
            r = 0.002
            angles = np.linspace(0, 2 * np.pi, 6, endpoint=False)
            return [[float(centroid[0] + r * np.cos(a)), float(centroid[1] + r * np.sin(a))] for a in angles]

        m = len(hull_pts)
        if m == 6:
            return [[float(p[0]), float(p[1])] for p in hull_pts]
        elif m < 6:
            pts = hull_pts.tolist()
            while len(pts) < 6:
                max_d = -1
                best_idx = 0
                for i in range(len(pts)):
                    p1 = np.array(pts[i])
                    p2 = np.array(pts[(i + 1) % len(pts)])
                    d = np.linalg.norm(p1 - p2)
                    if d > max_d:
                        max_d = d
                        best_idx = i
                p1 = np.array(pts[best_idx])
                p2 = np.array(pts[(best_idx + 1) % len(pts)])
                mid = ((p1 + p2) / 2.0).tolist()
                pts.insert(best_idx + 1, mid)
            return [[float(p[0]), float(p[1])] for p in pts[:6]]
        else:
            # m > 6: Directional extremum sampling in 6 radial directions (60-deg intervals)
            angles = np.linspace(0, 2 * np.pi, 6, endpoint=False)
            dir_pts = []
            for a in angles:
                vec = np.array([np.cos(a), np.sin(a)])
                dots = np.dot(hull_pts - centroid, vec)
                max_idx = np.argmax(dots)
                dir_pts.append(hull_pts[max_idx])

            # Deduplicate while preserving order
            unique_pts = []
            for p in dir_pts:
                if not any(np.allclose(p, u) for u in unique_pts):
                    unique_pts.append(p)

            while len(unique_pts) < 6:
                max_d = -1
                best_idx = 0
                for i in range(len(unique_pts)):
                    p1 = np.array(unique_pts[i])
                    p2 = np.array(unique_pts[(i + 1) % len(unique_pts)])
                    d = np.linalg.norm(p1 - p2)
                    if d > max_d:
                        max_d = d
                        best_idx = i
                p1 = np.array(unique_pts[best_idx])
                p2 = np.array(unique_pts[(best_idx + 1) % len(unique_pts)])
                mid = (p1 + p2) / 2.0
                unique_pts.insert(best_idx + 1, mid)

            return [[float(p[0]), float(p[1])] for p in unique_pts[:6]]

    def detect(self, incidents: list, min_cluster_size: int = 5) -> Dict[str, Any]:
        if not incidents or len(incidents) < min_cluster_size:
            return {"blackspots": []}

        df = pd.DataFrame(incidents)
        if 'latitude' not in df.columns or 'longitude' not in df.columns:
            return {"blackspots": []}

        # Drop invalid lat/lng
        df = df.dropna(subset=['latitude', 'longitude'])
        if len(df) < min_cluster_size:
            return {"blackspots": []}

        coords = df[['latitude', 'longitude']].values

        # HDBSCAN clustering
        clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, allow_single_cluster=True, metric='euclidean')
        labels = clusterer.fit_predict(coords)

        # Fallback if noise only
        if set(labels) == {-1}:
            clusterer = hdbscan.HDBSCAN(min_cluster_size=max(2, min_cluster_size // 2), allow_single_cluster=True, metric='euclidean')
            labels = clusterer.fit_predict(coords)

        blackspots = []
        for cluster_id in sorted(set(labels)):
            if cluster_id == -1:
                continue  # Noise

            mask = labels == cluster_id
            cluster_data = df[mask]
            cluster_coords = coords[mask]

            center_lat = float(cluster_coords[:, 0].mean())
            center_lng = float(cluster_coords[:, 1].mean())

            # Extract organic 6-point convex hull polygon bounds
            bounds = self.compute_organic_6pt_hull(cluster_coords)

            avg_severity = float(cluster_data['severity'].mean()) if 'severity' in cluster_data.columns else 3.0

            factors: Dict[str, int] = {}
            if 'contributing_factors' in cluster_data.columns:
                for f_list in cluster_data['contributing_factors']:
                    if isinstance(f_list, list):
                        for f in f_list:
                            factors[str(f)] = factors.get(str(f), 0) + 1

            risk_score = float(len(cluster_data) * (5.0 - avg_severity))

            blackspots.append({
                "cluster_id": int(cluster_id),
                "center": [center_lat, center_lng],
                "bounds": bounds,
                "incident_count": len(cluster_data),
                "avg_severity": avg_severity,
                "risk_score": risk_score,
                "primary_factors": factors
            })

        return {"blackspots": blackspots}
