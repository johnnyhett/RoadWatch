package com.taprs.application.port.in;

import com.taprs.domain.model.RouteComparison;

public interface ComputeRouteUseCase {
    RouteComparison computeSafestRoute(double startLat, double startLng, double endLat, double endLng, double alpha, double beta);
}
