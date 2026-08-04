package com.taprs.application.port.in;

import com.taprs.domain.model.SafetyRoute;

public interface ComputeRouteUseCase {
    SafetyRoute computeSafestRoute(double startLat, double startLng, double endLat, double endLng);
}
