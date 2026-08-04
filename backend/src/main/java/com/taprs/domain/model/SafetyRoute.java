package com.taprs.domain.model;

import java.util.List;

public record SafetyRoute(
    List<double[]> path,
    double totalRisk,
    double distanceKm
) {}
