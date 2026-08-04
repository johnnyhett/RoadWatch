import pandas as pd
from sklearn.preprocessing import LabelEncoder

class FeatureEngine:
    def __init__(self):
        self.label_encoders = {}
        
    def fit_transform(self, df: pd.DataFrame, categorical_cols: list):
        out_df = df.copy()
        for col in categorical_cols:
            le = LabelEncoder()
            out_df[col] = le.fit_transform(out_df[col].astype(str))
            self.label_encoders[col] = le
        return out_df
        
    def transform(self, df: pd.DataFrame):
        out_df = df.copy()
        for col, le in self.label_encoders.items():
            if col in out_df.columns:
                # Handle unseen labels by mapping them to a default or first class, or skipping
                # For simplicity, we assume labels are known or we handle exceptions
                try:
                    out_df[col] = le.transform(out_df[col].astype(str))
                except ValueError:
                    # In production, handle unseen labels properly
                    pass
        return out_df
