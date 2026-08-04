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
        double lat = Double.parseDouble(request.get("latitude").toString());
        double lng = Double.parseDouble(request.get("longitude").toString());
        String time = request.getOrDefault("timestamp", "").toString();
        String weather = request.getOrDefault("weatherCondition", "").toString();
        
        return predictRiskUseCase.predictRisk(lat, lng, time, weather);
    }
}
