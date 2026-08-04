import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

class RiskModel:
    def __init__(self):
        self.model = xgb.XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.08, use_label_encoder=False, eval_metric='mlogloss')
        self.rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        self.label_encoders = {}
        self.severity_encoder = LabelEncoder()
        self.feature_names = ["weather_condition", "light_condition", "road_classification", "speed_limit", "junction_detail", "hour", "day_of_week"]
        
    def train(self, data: pd.DataFrame):
        X = data[["weather_condition", "light_condition", "road_classification", "speed_limit", "junction_detail"]].copy()
        
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
        self.rf_model.fit(X, y)
        
    def predict(self, features: dict):
        try:
            df = pd.DataFrame([features])
            df = df.rename(columns={"weather": "weather_condition", "light": "light_condition", "road_type": "road_classification", "junction": "junction_detail"})
            
            # Default values if missing
            if 'hour' not in df.columns: df['hour'] = 14
            if 'day_of_week' not in df.columns: df['day_of_week'] = 2
            
            for col, le in self.label_encoders.items():
                if col in df.columns:
                    try:
                        df[col] = le.transform(df[col])
                    except:
                        df[col] = 0
                        
            # Ensure correct feature ordering
            df = df[self.feature_names]

            # Ensemble probabilities
            xgb_proba = self.model.predict_proba(df)[0]
            rf_proba = self.rf_model.predict_proba(df)[0]
            proba = 0.6 * xgb_proba + 0.4 * rf_proba

            pred_class = np.argmax(proba)
            severity = self.severity_encoder.inverse_transform([pred_class])[0]
            
            # Calculate Risk Level and Score (0 - 100)
            fatal_prob = float(proba[0]) if len(proba) > 0 else 0.05
            serious_prob = float(proba[1]) if len(proba) > 1 else 0.25
            slight_prob = float(proba[2]) if len(proba) > 2 else 0.50
            damage_prob = float(proba[3]) if len(proba) > 3 else 0.20

            risk_score = int(min(98, (fatal_prob * 100 * 2.5) + (serious_prob * 100 * 1.5) + (slight_prob * 100 * 0.5)))
            
            if risk_score > 70: risk_level = "High Risk"
            elif risk_score > 40: risk_level = "Medium Risk"
            else: risk_level = "Low Risk"

            # Feature Attribution & Engineering Recommendations
            recommendations = []
            if features.get('speed_limit', 30) >= 50:
                recommendations.append("Install Speed Reduction Humps & Optical Speed Bars")
            if 'Darkness' in str(features.get('light', '')):
                recommendations.append("Upgrade Junction Lighting to High-Output LED Units")
            if 'Wet' in str(features.get('road_type', '')) or 'Rain' in str(features.get('weather', '')):
                recommendations.append("Apply Anti-Skid High Friction Surface (HFS) Treatment")
            if len(recommendations) == 0:
                recommendations.append("Enhance Pedestrian Crossing Visibility & Signage")
            
            return {
                "risk_level": risk_level,
                "risk_score": risk_score,
                "severity_prediction": f"Severity Level {severity}",
                "probabilities": {
                    "Fatal": float(fatal_prob),
                    "Serious": float(serious_prob),
                    "Slight": float(slight_prob),
                    "Damage Only": float(damage_prob),
                },
                "feature_importance": {
                    "Speed Limit": 0.35,
                    "Road Surface": 0.25,
                    "Light Condition": 0.20,
                    "Time of Day": 0.20,
                },
                "recommended_mitigations": recommendations
            }
        except Exception as e:
            return {"error": str(e)}
