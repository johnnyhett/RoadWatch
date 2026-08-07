import logging

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

log = logging.getLogger(__name__)

# Normalized severity codes shared across the ingestion schemas.
SEVERITY_LABELS = {1: "Fatal", 2: "Serious", 3: "Slight", 4: "Damage Only"}

# Contribution of each severity class to the 0-100 composite risk score.
SEVERITY_RISK_WEIGHTS = {1: 100.0, 2: 75.0, 3: 40.0, 4: 10.0}

CATEGORICAL_FEATURES = ["weather_condition", "light_condition", "road_classification", "junction_detail"]


class RiskModel:
    def __init__(self):
        self.model = xgb.XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.08, eval_metric='mlogloss')
        self.rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        self.label_encoders = {}
        self.severity_encoder = LabelEncoder()
        self.feature_names = ["weather_condition", "light_condition", "road_classification", "speed_limit", "junction_detail", "hour", "day_of_week"]
        self.is_trained = False

    def train(self, data: pd.DataFrame):
        missing = [c for c in CATEGORICAL_FEATURES + ["speed_limit", "timestamp", "severity"] if c not in data.columns]
        if missing:
            raise ValueError(f"Training data is missing required columns: {missing}")

        X = data[["weather_condition", "light_condition", "road_classification", "speed_limit", "junction_detail"]].copy()

        # Add temporal features
        timestamps = pd.to_datetime(data['timestamp'], errors='coerce')
        X['hour'] = timestamps.dt.hour.fillna(12).astype(int)
        X['day_of_week'] = timestamps.dt.dayofweek.fillna(0).astype(int)
        X['speed_limit'] = pd.to_numeric(X['speed_limit'], errors='coerce').fillna(30).astype(int)

        # Encode categorical
        for col in CATEGORICAL_FEATURES:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            self.label_encoders[col] = le

        X = X[self.feature_names]
        y = self.severity_encoder.fit_transform(data['severity'])

        self.model.fit(X, y)
        self.rf_model.fit(X, y)
        self.is_trained = True

    def _severity_probabilities(self, proba: np.ndarray) -> dict:
        """
        Map the model's per-class probabilities onto the four normalized severity
        labels using the fitted encoder's class order.

        Positional indexing (proba[0] -> Fatal, proba[1] -> Serious, ...) is only
        correct when the training data happened to contain all four severities in
        order; otherwise it silently mislabels classes and pads the remainder with
        constants, yielding a distribution that does not sum to 1.
        """
        distribution = {label: 0.0 for label in SEVERITY_LABELS.values()}
        for index, severity_code in enumerate(self.severity_encoder.classes_):
            label = SEVERITY_LABELS.get(int(severity_code))
            if label is not None and index < len(proba):
                distribution[label] = float(proba[index])
        return distribution

    def predict(self, features: dict):
        if not self.is_trained:
            return {"error": "Risk model has not been trained yet."}
        try:
            norm = {}
            norm['weather_condition'] = str(features.get('weather_condition') or features.get('weatherCondition') or features.get('weather') or "Clear")
            norm['light_condition'] = str(features.get('light_condition') or features.get('lightCondition') or features.get('light') or "Daylight")
            norm['road_classification'] = str(features.get('road_classification') or features.get('roadClassification') or features.get('road_type') or features.get('roadType') or "A_Road")

            try:
                norm['speed_limit'] = int(features.get('speed_limit') or features.get('speedLimit') or 30)
            except (TypeError, ValueError):
                norm['speed_limit'] = 30

            norm['junction_detail'] = str(features.get('junction_detail') or features.get('junctionDetail') or features.get('junction') or "Not_At_Junction")

            road_surface = str(
                features.get('road_surface_condition')
                or features.get('roadSurfaceCondition')
                or features.get('road_surface')
                or features.get('road_type')
                or ""
            )

            ts = features.get('timestamp') or features.get('time')
            if ts:
                try:
                    dt = pd.to_datetime(ts)
                    norm['hour'] = int(dt.hour)
                    norm['day_of_week'] = int(dt.dayofweek)
                except (TypeError, ValueError):
                    norm['hour'] = int(features.get('hour', 14))
                    norm['day_of_week'] = int(features.get('day_of_week', 2))
            else:
                norm['hour'] = int(features.get('hour', 14))
                norm['day_of_week'] = int(features.get('day_of_week', 2))

            df = pd.DataFrame([norm])

            for col, le in self.label_encoders.items():
                if col in df.columns:
                    try:
                        df[col] = le.transform(df[col].astype(str))
                    except ValueError:
                        # Unseen category at inference time -> fall back to the first known class.
                        df[col] = 0

            # Ensure correct feature ordering
            df = df[self.feature_names]

            # Ensemble probabilities
            xgb_proba = self.model.predict_proba(df)[0]
            rf_proba = self.rf_model.predict_proba(df)[0]
            proba = 0.6 * xgb_proba + 0.4 * rf_proba

            pred_class = int(np.argmax(proba))
            severity_code = int(self.severity_encoder.classes_[pred_class])
            severity_label = SEVERITY_LABELS.get(severity_code, f"Severity Level {severity_code}")

            probabilities = self._severity_probabilities(proba)

            # Expected severity cost over the predicted distribution, on a 0-100 scale.
            risk_score = 0.0
            for code, label in SEVERITY_LABELS.items():
                risk_score += probabilities[label] * SEVERITY_RISK_WEIGHTS[code]
            risk_score = int(round(max(0.0, min(100.0, risk_score))))

            if risk_score > 70:
                risk_level = "High Risk"
            elif risk_score > 40:
                risk_level = "Medium Risk"
            else:
                risk_level = "Low Risk"

            # Feature Attribution & Engineering Recommendations
            recommendations = []
            if norm['speed_limit'] >= 50:
                recommendations.append("Install Speed Reduction Humps & Optical Speed Bars")
            if 'Darkness' in norm['light_condition']:
                recommendations.append("Upgrade Junction Lighting to High-Output LED Units")
            if 'Wet' in road_surface or 'Ice' in road_surface or 'Rain' in norm['weather_condition']:
                recommendations.append("Apply Anti-Skid High Friction Surface (HFS) Treatment")
            if len(recommendations) == 0:
                recommendations.append("Enhance Pedestrian Crossing Visibility & Signage")

            return {
                "risk_level": risk_level,
                "risk_score": risk_score,
                "severity_prediction": severity_label,
                "probabilities": probabilities,
                "feature_importance": self._feature_importance(),
                "recommended_mitigations": recommendations
            }
        except Exception:
            # Logged with the trace server-side; the caller gets a flag only, so
            # internal types and paths are not echoed back over the API.
            log.exception("Risk prediction failed")
            return {"error": "prediction_failed"}

    def _feature_importance(self) -> dict:
        """Normalized gain-based attribution from the trained XGBoost booster."""
        try:
            raw = self.model.feature_importances_
            total = float(np.sum(raw))
            if total <= 0:
                return {}
            return {name: round(float(value) / total, 4) for name, value in zip(self.feature_names, raw)}
        except Exception:
            return {}
