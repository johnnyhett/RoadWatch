package com.taprs.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record SafetyRoute(
    @JsonProperty("path") List<double[]> path,
    @JsonProperty("total_risk") double totalRisk,
    @JsonProperty("distance_km") double distanceKm
) {}
