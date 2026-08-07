import numpy as np
from scipy.stats import gaussian_kde
import pandas as pd

class DensityEstimator:
    def generate_heatmap(self, incidents: list, grid_resolution: int = 100):
        if not incidents:
            return {"grid": {}}

        df = pd.DataFrame(incidents)

        # Records arrive from unauthenticated callers, so a column may be absent
        # or hold non-numeric values. Indexing/arithmetic straight off the frame
        # raised KeyError/TypeError and surfaced as an opaque 500.
        if 'latitude' not in df.columns or 'longitude' not in df.columns:
            return {"grid": {}}

        df = df.assign(
            latitude=pd.to_numeric(df['latitude'], errors='coerce'),
            longitude=pd.to_numeric(df['longitude'], errors='coerce'),
        ).dropna(subset=['latitude', 'longitude'])

        if df.empty:
            return {"grid": {}}

        lats = df['latitude'].values
        lngs = df['longitude'].values

        # Higher weight for higher severity (1 is max); default to mid severity
        # when the column is missing or unparseable.
        if 'severity' in df.columns:
            severity = pd.to_numeric(df['severity'], errors='coerce').fillna(3.0)
        else:
            severity = pd.Series(3.0, index=df.index)
        weights = (5.0 - severity.clip(lower=1.0, upper=4.0)).values
        
        lat_min, lat_max = lats.min() - 0.01, lats.max() + 0.01
        lng_min, lng_max = lngs.min() - 0.01, lngs.max() + 0.01
        
        lat_grid = np.linspace(lat_min, lat_max, grid_resolution)
        lng_grid = np.linspace(lng_min, lng_max, grid_resolution)
        Lng, Lat = np.meshgrid(lng_grid, lat_grid)
        
        positions = np.vstack([Lat.ravel(), Lng.ravel()])
        values = np.vstack([lats, lngs])
        
        try:
            kernel = gaussian_kde(values, weights=weights)
            Z = np.reshape(kernel(positions).T, Lat.shape)
        except np.linalg.LinAlgError:
            Z = np.zeros(Lat.shape)
            
        return {
            "grid": {
                "lat_range": [float(lat_min), float(lat_max)],
                "lng_range": [float(lng_min), float(lng_max)],
                "density_matrix": Z.tolist()
            }
        }
