package com.taprs.infrastructure.web.controller;

import com.taprs.application.port.in.PredictRiskUseCase;
import com.taprs.domain.model.RiskPrediction;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/predictions")
public class PredictionController {

    private final PredictRiskUseCase predictRiskUseCase;

    public PredictionController(PredictRiskUseCase predictRiskUseCase) {
        this.predictRiskUseCase = predictRiskUseCase;
    }

    @PostMapping("/risk")
    public RiskPrediction predictRisk(@RequestBody Map<String, Object> request) {
        if (request.containsKey("features") && request.get("features") instanceof Map<?, ?> featMap) {
            @SuppressWarnings("unchecked")
            Map<String, Object> features = (Map<String, Object>) featMap;
            return predictRiskUseCase.predictRisk(features);
        }
        return predictRiskUseCase.predictRisk(request);
    }
}
