package com.taprs.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RouteComparison(
    @JsonProperty("safest_route") SafetyRoute safestRoute,
    @JsonProperty("fastest_route") SafetyRoute fastestRoute
) {}
