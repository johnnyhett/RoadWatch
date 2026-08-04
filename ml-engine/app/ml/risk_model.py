import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder

class RiskModel:
    def __init__(self):
        self.model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='mlogloss')
        self.label_encoders = {}
        self.severity_encoder = LabelEncoder()
        
    def train(self, data: pd.DataFrame):
        features = ["weather_condition", "light_condition", "road_classification", "speed_limit", "junction_detail"]
        X = data[features].copy()
        
        # Add temporal features
        X['hour'] = pd.to_datetime(data['timestamp']).dt.hour
        X['day_of_week'] = pd.to_datetime(data['timestamp']).dt.dayofweek
        
        # Encode categorical
        for col in ["weather_condition", "light_condition", "road_classification", "junction_detail"]:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])
            self.label_encoders[col] = le
            
        y = self.severity_encoder.fit_transform(data['severity'])
        
        self.model.fit(X, y)
        
    def predict(self, features: dict):
        try:
            df = pd.DataFrame([features])
            df = df.rename(columns={"weather": "weather_condition", "light": "light_condition", "road_type": "road_classification", "junction": "junction_detail"})
            
            for col, le in self.label_encoders.items():
                if col in df.columns:
                    # Handle unseen labels gracefully if necessary
                    df[col] = le.transform(df[col])
                    
            proba = self.model.predict_proba(df)[0]
            pred_class = self.model.predict(df)[0]
            
            # Severity mapping: 1=Fatal, 2=Serious, 3=Slight, 4=Damage_Only
            severity = self.severity_encoder.inverse_transform([pred_class])[0]
            
            # Create risk scores from probabilities
            low_prob = float(proba[-1]) if len(proba) > 3 else 0.5
            high_prob = float(proba[0]) + float(proba[1]) if len(proba) > 1 else 0.1
            medium_prob = 1.0 - low_prob - high_prob
            
            if high_prob > 0.3: risk = "HIGH"
            elif medium_prob > 0.4: risk = "MEDIUM"
            else: risk = "LOW"
            
            return {
                "risk_level": risk,
                "probabilities": {
                    "LOW": float(low_prob),
                    "MEDIUM": float(medium_prob),
                    "HIGH": float(high_prob)
                },
                "severity_prediction": str(severity)
            }
        except Exception as e:
            return {"error": str(e)}
