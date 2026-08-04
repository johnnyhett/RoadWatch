package com.taprs.application.port.in;

import com.taprs.domain.model.RiskPrediction;

public interface PredictRiskUseCase {
    RiskPrediction predictRisk(double lat, double lng, String time, String weather);
}
