package com.taprs.domain.model;

import java.util.Map;

public record TemporalPattern(
    Map<String, Integer> hourlyDistribution,
    Map<String, Integer> dailyDistribution,
    Map<String, Integer> monthlyDistribution
) {}
