package com.taprs.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Core domain entity representing a traffic accident record.
 * Uses Jackson annotations to map from snake_case JSON dataset fields.
 */
public record Incident(
    @JsonProperty("accident_id") String id,
    double latitude,
    double longitude,
    String timestamp,
    int severity,
    @JsonProperty("num_vehicles") int numVehicles,
    @JsonProperty("num_casualties") int numCasualties,
    @JsonProperty("weather_condition") String weatherCondition,
    @JsonProperty("road_surface_condition") String roadSurface,
    @JsonProperty("light_condition") String lightCondition,
    @JsonProperty("road_classification") String roadClassification,
    @JsonProperty("speed_limit") Integer speedLimit,
    @JsonProperty("junction_detail") String junctionDetail,
    @JsonProperty("vehicle_types") List<String> vehicleTypes,
    @JsonProperty("contributing_factors") List<String> contributingFactors
) {
    /**
     * Returns a human-readable severity label.
     */
    public String severityLabel() {
        return switch (severity) {
            case 1 -> "Fatal";
            case 2 -> "Serious";
            case 3 -> "Slight";
            case 4 -> "Damage_Only";
            default -> "Unknown";
        };
    }
}
