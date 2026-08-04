package com.taprs.domain.model;

import java.util.Map;

public record Blackspot(
    String clusterId,
    double[] center,
    double[][] bounds,
    int incidentCount,
    double avgSeverity,
    double riskScore,
    Map<String, Integer> primaryFactors
) {}
