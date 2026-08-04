package com.taprs.application.service;

import com.taprs.application.port.in.ComputeRouteUseCase;
import com.taprs.application.port.out.MlEnginePort;
import com.taprs.domain.model.RouteComparison;
import org.springframework.stereotype.Service;

@Service
public class RouteService implements ComputeRouteUseCase {

    private final MlEnginePort mlEnginePort;

    public RouteService(MlEnginePort mlEnginePort) {
        this.mlEnginePort = mlEnginePort;
    }

    @Override
    public RouteComparison computeSafestRoute(double startLat, double startLng, double endLat, double endLng, double alpha, double beta) {
        return mlEnginePort.computeSafestRoute(startLat, startLng, endLat, endLng, alpha, beta);
    }
}
