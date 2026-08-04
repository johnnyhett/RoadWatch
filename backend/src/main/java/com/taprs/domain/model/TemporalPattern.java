package com.taprs.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record TemporalPattern(
    @JsonProperty("hourly_distribution") List<Map<String, Object>> hourlyDistribution,
    @JsonProperty("daily_distribution") List<Map<String, Object>> dailyDistribution,
    @JsonProperty("risk_multipliers") Map<String, Double> riskMultipliers
) {}
