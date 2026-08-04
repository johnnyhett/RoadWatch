package com.taprs.domain.model;

import java.util.Map;

public record RiskPrediction(
    String riskLevel,
    Map<String, Double> probabilities,
    String severityPrediction
) {}
