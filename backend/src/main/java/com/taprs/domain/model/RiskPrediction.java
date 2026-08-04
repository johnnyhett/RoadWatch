package com.taprs.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record RiskPrediction(
    @JsonProperty("risk_level") String riskLevel,
    @JsonProperty("risk_score") Integer riskScore,
    @JsonProperty("severity_prediction") String severityPrediction,
    @JsonProperty("probabilities") Map<String, Double> probabilities,
    @JsonProperty("feature_importance") Map<String, Double> featureImportance,
    @JsonProperty("recommended_mitigations") List<String> recommendedMitigations
) {}
