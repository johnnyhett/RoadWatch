package com.taprs.application.port.in;

import com.taprs.domain.model.RiskPrediction;
import java.util.Map;

public interface PredictRiskUseCase {
    RiskPrediction predictRisk(double lat, double lng, String time, String weather);
    RiskPrediction predictRisk(Map<String, Object> features);
}
