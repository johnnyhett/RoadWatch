package com.taprs.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record Blackspot(
    @JsonProperty("cluster_id") Integer clusterId,
    @JsonProperty("center") double[] center,
    @JsonProperty("bounds") List<double[]> bounds,
    @JsonProperty("incident_count") int incidentCount,
    @JsonProperty("avg_severity") double avgSeverity,
    @JsonProperty("risk_score") double riskScore,
    @JsonProperty("primary_factors") Map<String, Integer> primaryFactors
) {}
