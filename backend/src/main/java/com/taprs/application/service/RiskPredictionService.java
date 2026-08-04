package com.taprs.application.service;

import com.taprs.application.port.in.PredictRiskUseCase;
import com.taprs.application.port.out.MlEnginePort;
import com.taprs.domain.model.RiskPrediction;
import org.springframework.stereotype.Service;

@Service
public class RiskPredictionService implements PredictRiskUseCase {

    private final MlEnginePort mlEnginePort;

    public RiskPredictionService(MlEnginePort mlEnginePort) {
        this.mlEnginePort = mlEnginePort;
    }

    @Override
    public RiskPrediction predictRisk(double lat, double lng, String time, String weather) {
        return mlEnginePort.predictRisk(lat, lng, time, weather);
    }
}
