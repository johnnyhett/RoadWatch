package com.taprs.application.service;

import com.taprs.application.port.in.ComputeRouteUseCase;
import com.taprs.application.port.out.MlEnginePort;
import com.taprs.domain.model.SafetyRoute;
import org.springframework.stereotype.Service;

@Service
public class RouteService implements ComputeRouteUseCase {

    private final MlEnginePort mlEnginePort;

    public RouteService(MlEnginePort mlEnginePort) {
        this.mlEnginePort = mlEnginePort;
    }

    @Override
    public SafetyRoute computeSafestRoute(double startLat, double startLng, double endLat, double endLng) {
        return mlEnginePort.computeSafestRoute(startLat, startLng, endLat, endLng);
    }
}
