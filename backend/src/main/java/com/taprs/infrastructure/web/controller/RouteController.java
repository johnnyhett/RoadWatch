package com.taprs.infrastructure.web.controller;

import com.taprs.application.port.in.ComputeRouteUseCase;
import com.taprs.domain.model.RouteComparison;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final ComputeRouteUseCase computeRouteUseCase;

    public RouteController(ComputeRouteUseCase computeRouteUseCase) {
        this.computeRouteUseCase = computeRouteUseCase;
    }

    @PostMapping("/safest")
    public RouteComparison computeSafestRoute(@RequestBody Map<String, Object> request) {
        double startLat = 0.0;
        double startLng = 0.0;
        double endLat = 0.0;
        double endLng = 0.0;

        if (request.containsKey("origin") && request.get("origin") instanceof List<?> origList && origList.size() >= 2) {
            startLat = Double.parseDouble(origList.get(0).toString());
            startLng = Double.parseDouble(origList.get(1).toString());
        } else if (request.containsKey("startLatitude")) {
            startLat = Double.parseDouble(request.get("startLatitude").toString());
            startLng = Double.parseDouble(request.get("startLongitude").toString());
        }

        if (request.containsKey("destination") && request.get("destination") instanceof List<?> destList && destList.size() >= 2) {
            endLat = Double.parseDouble(destList.get(0).toString());
            endLng = Double.parseDouble(destList.get(1).toString());
        } else if (request.containsKey("endLatitude")) {
            endLat = Double.parseDouble(request.get("endLatitude").toString());
            endLng = Double.parseDouble(request.get("endLongitude").toString());
        }

        double alpha = request.containsKey("alpha") ? Double.parseDouble(request.get("alpha").toString()) : 0.5;
        double beta = request.containsKey("beta") ? Double.parseDouble(request.get("beta").toString()) : 0.5;

        return computeRouteUseCase.computeSafestRoute(startLat, startLng, endLat, endLng, alpha, beta);
    }
}
