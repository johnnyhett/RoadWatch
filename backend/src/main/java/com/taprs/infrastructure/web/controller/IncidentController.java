package com.taprs.infrastructure.web.controller;

import com.taprs.application.port.in.GetIncidentsUseCase;
import com.taprs.domain.model.Incident;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final GetIncidentsUseCase getIncidentsUseCase;

    public IncidentController(GetIncidentsUseCase getIncidentsUseCase) {
        this.getIncidentsUseCase = getIncidentsUseCase;
    }

    @GetMapping({"", "/"})
    public List<Incident> getAllIncidents() {
        return getIncidentsUseCase.getAllIncidents();
    }

    @GetMapping("/{id}")
    public Incident getIncidentById(@PathVariable String id) {
        return getIncidentsUseCase.getIncidentById(id);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return getIncidentsUseCase.getAggregateStats();
    }

    @GetMapping("/geojson")
    public Map<String, Object> getGeoJson() {
        List<Incident> incidents = getIncidentsUseCase.getAllIncidents();

        Map<String, Object> geoJson = new HashMap<>();
        geoJson.put("type", "FeatureCollection");

        List<Map<String, Object>> features = incidents.stream().map(incident -> {
            Map<String, Object> feature = new HashMap<>();
            feature.put("type", "Feature");

            Map<String, Object> geometry = new HashMap<>();
            geometry.put("type", "Point");
            geometry.put("coordinates", new double[]{incident.longitude(), incident.latitude()});

            feature.put("geometry", geometry);
            feature.put("properties", incident);

            return feature;
        }).collect(Collectors.toList());

        geoJson.put("features", features);
        return geoJson;
    }
}
