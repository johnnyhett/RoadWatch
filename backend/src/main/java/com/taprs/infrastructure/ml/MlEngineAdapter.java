package com.taprs.infrastructure.ml;

import com.taprs.application.port.out.MlEnginePort;
import com.taprs.domain.model.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Component
public class MlEngineAdapter implements MlEnginePort {

    private final WebClient webClient;

    public MlEngineAdapter(WebClient.Builder webClientBuilder, @Value("${ml-engine.base-url}") String baseUrl) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    @Override
    public List<Blackspot> findBlackspots() {
        return webClient.post()
                .uri("/api/v1/analytics/blackspots")
                .retrieve()
                .bodyToFlux(Blackspot.class)
                .collectList()
                .block();
    }

    @Override
    public Map<String, Object> generateHeatmap() {
        return webClient.post()
                .uri("/api/v1/analytics/heatmap")
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @Override
    public List<AssociationRule> mineAssociations() {
        return webClient.post()
                .uri("/api/v1/analytics/associations")
                .retrieve()
                .bodyToFlux(AssociationRule.class)
                .collectList()
                .block();
    }

    @Override
    public TemporalPattern getTemporalPatterns() {
        return webClient.get()
                .uri("/api/v1/analytics/temporal")
                .retrieve()
                .bodyToMono(TemporalPattern.class)
                .block();
    }

    @Override
    public RiskPrediction predictRisk(double lat, double lng, String time, String weather) {
        Map<String, Object> request = new HashMap<>();
        request.put("latitude", lat);
        request.put("longitude", lng);
        request.put("timestamp", time);
        request.put("weatherCondition", weather);
        
        return webClient.post()
                .uri("/api/v1/predictions/risk")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(RiskPrediction.class)
                .block();
    }

    @Override
    public SafetyRoute computeSafestRoute(double startLat, double startLng, double endLat, double endLng) {
        Map<String, Object> request = new HashMap<>();
        request.put("startLatitude", startLat);
        request.put("startLongitude", startLng);
        request.put("endLatitude", endLat);
        request.put("endLongitude", endLng);
        
        return webClient.post()
                .uri("/api/v1/routes/safest")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SafetyRoute.class)
                .block();
    }
}
