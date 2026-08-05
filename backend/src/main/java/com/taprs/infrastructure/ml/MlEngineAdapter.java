package com.taprs.infrastructure.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.application.port.out.MlEnginePort;
import com.taprs.application.port.out.MlEngineUnavailableException;
import com.taprs.domain.model.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Component
public class MlEngineAdapter implements MlEnginePort {

    private final WebClient webClient;
    private final IncidentRepositoryPort incidentRepository;
    private final Duration timeout;

    public record BlackspotsResponse(@JsonProperty("blackspots") List<Blackspot> blackspots) {}
    public record AssociationRulesResponse(@JsonProperty("rules") List<AssociationRule> rules) {}

    public MlEngineAdapter(WebClient.Builder webClientBuilder,
                           @Value("${ml-engine.base-url}") String baseUrl,
                           @Value("${ml-engine.timeout-seconds:30}") long timeoutSeconds,
                           IncidentRepositoryPort incidentRepository) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.incidentRepository = incidentRepository;
        this.timeout = Duration.ofSeconds(timeoutSeconds);
    }

    /**
     * Every outbound call is bounded and its failures are translated.
     *
     * <p>A bare {@code .block()} waits forever when the engine accepts the
     * connection but never answers, pinning a servlet thread per request until
     * the container's pool is exhausted. Connection failures become
     * {@link MlEngineUnavailableException} so they surface as 503 rather than
     * being reported as a fault in this service.
     */
    private <T> T call(String operation, Supplier<T> request) {
        try {
            return request.get();
        } catch (MlEngineUnavailableException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new MlEngineUnavailableException(operation, ex);
        }
    }

    @Override
    public List<Blackspot> findBlackspots() {
        List<Incident> incidents = incidentRepository.findAll();
        Map<String, Object> request = Map.of(
            "incidents", incidents,
            "min_cluster_size", 5
        );

        BlackspotsResponse response = call("findBlackspots", () -> webClient.post()
                .uri("/api/v1/clustering/blackspots")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(BlackspotsResponse.class)
                .block(timeout));

        return response != null && response.blackspots() != null ? response.blackspots() : List.of();
    }

    @Override
    public Map<String, Object> generateHeatmap() {
        List<Incident> incidents = incidentRepository.findAll();
        Map<String, Object> request = Map.of(
            "incidents", incidents,
            "grid_resolution", 100
        );

        Map<String, Object> response = call("generateHeatmap", () -> webClient.post()
                .uri("/api/v1/density/heatmap")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block(timeout));

        return response != null ? response : Map.of();
    }

    @Override
    public List<AssociationRule> mineAssociations() {
        List<Incident> incidents = incidentRepository.findAll();
        Map<String, Object> request = Map.of(
            "incidents", incidents,
            "min_support", 0.05,
            "min_confidence", 0.3
        );

        AssociationRulesResponse response = call("mineAssociations", () -> webClient.post()
                .uri("/api/v1/association/rules")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AssociationRulesResponse.class)
                .block(timeout));

        return response != null && response.rules() != null ? response.rules() : List.of();
    }

    @Override
    public TemporalPattern getTemporalPatterns() {
        return call("getTemporalPatterns", () -> webClient.get()
                .uri("/api/v1/temporal/patterns")
                .retrieve()
                .bodyToMono(TemporalPattern.class)
                .block(timeout));
    }

    @Override
    public RiskPrediction predictRisk(double lat, double lng, String time, String weather) {
        Map<String, Object> features = new HashMap<>();
        features.put("latitude", lat);
        features.put("longitude", lng);
        features.put("timestamp", time);
        features.put("weatherCondition", weather);
        return predictRisk(features);
    }

    @Override
    public RiskPrediction predictRisk(Map<String, Object> features) {
        Map<String, Object> request = Map.of("features", features);

        return call("predictRisk", () -> webClient.post()
                .uri("/api/v1/prediction/risk")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(RiskPrediction.class)
                .block(timeout));
    }

    @Override
    public RouteComparison computeSafestRoute(double startLat, double startLng, double endLat, double endLng, double alpha, double beta) {
        Map<String, Object> request = Map.of(
            "origin", List.of(startLat, startLng),
            "destination", List.of(endLat, endLng),
            "alpha", alpha,
            "beta", beta
        );

        return call("computeSafestRoute", () -> webClient.post()
                .uri("/api/v1/routing/safest")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(RouteComparison.class)
                .block(timeout));
    }
}
