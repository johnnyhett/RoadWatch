package com.taprs.application.service;

import com.taprs.application.port.in.GetIncidentsUseCase;
import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.domain.model.Incident;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Application service implementing incident query use cases.
 * Aggregates statistics from the in-memory incident repository.
 */
@Service
public class IncidentService implements GetIncidentsUseCase {

    private final IncidentRepositoryPort repository;

    public IncidentService(IncidentRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public List<Incident> getAllIncidents() {
        return repository.findAll();
    }

    @Override
    public Incident getIncidentById(String id) {
        return repository.findById(id);
    }

    /**
     * Aggregate statistics keyed in snake_case.
     *
     * <p>These are {@link Map} entries, not bean properties, so Jackson's
     * configured SNAKE_CASE naming strategy does not rewrite them — the keys
     * must already match the {@code IncidentStats} contract the web client
     * consumes ({@code by_severity}, {@code total_casualties}, ...).
     */
    @Override
    public Map<String, Object> getAggregateStats() {
        List<Incident> incidents = repository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", incidents.size());
        // Alias consumed by the institutional reporting clients.
        stats.put("total_incidents", incidents.size());

        // Severity distribution using labels
        Map<String, Long> bySeverity = new HashMap<>();
        for (Incident i : incidents) {
            String label = i.severityLabel();
            bySeverity.merge(label, 1L, Long::sum);
        }
        stats.put("by_severity", bySeverity);

        // Weather distribution
        Map<String, Long> byWeather = new HashMap<>();
        for (Incident i : incidents) {
            byWeather.merge(i.weatherCondition(), 1L, Long::sum);
        }
        stats.put("by_weather", byWeather);

        // Road classification distribution
        Map<String, Long> byRoad = new HashMap<>();
        for (Incident i : incidents) {
            byRoad.merge(i.roadClassification(), 1L, Long::sum);
        }
        stats.put("by_road_type", byRoad);

        // Light condition distribution
        Map<String, Long> byLight = new HashMap<>();
        for (Incident i : incidents) {
            byLight.merge(i.lightCondition(), 1L, Long::sum);
        }
        stats.put("by_light_condition", byLight);

        // Total casualties
        int totalCasualties = incidents.stream().mapToInt(Incident::numCasualties).sum();
        stats.put("total_casualties", totalCasualties);

        // Average severity
        double avgSeverity = incidents.stream().mapToInt(Incident::severity).average().orElse(0.0);
        stats.put("average_severity", Math.round(avgSeverity * 100.0) / 100.0);

        return stats;
    }
}
