import numpy as np
from scipy.stats import gaussian_kde
import pandas as pd

class DensityEstimator:
    def generate_heatmap(self, incidents: list, grid_resolution: int = 100):
        if not incidents:
            return {"grid": {}}
            
        df = pd.DataFrame(incidents)
        lats = df['latitude'].values
        lngs = df['longitude'].values
        weights = (5 - df['severity'].values) # Higher weight for higher severity (1 is max)
        
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
