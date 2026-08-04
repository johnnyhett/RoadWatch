package com.taprs.infrastructure.web.controller;

import com.taprs.application.port.in.ComputeRouteUseCase;
import com.taprs.domain.model.SafetyRoute;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final ComputeRouteUseCase computeRouteUseCase;

    public RouteController(ComputeRouteUseCase computeRouteUseCase) {
        this.computeRouteUseCase = computeRouteUseCase;
    }

    @PostMapping("/safest")
    public SafetyRoute computeSafestRoute(@RequestBody Map<String, Object> request) {
        double startLat = Double.parseDouble(request.get("startLatitude").toString());
        double startLng = Double.parseDouble(request.get("startLongitude").toString());
        double endLat = Double.parseDouble(request.get("endLatitude").toString());
        double endLng = Double.parseDouble(request.get("endLongitude").toString());
        
        return computeRouteUseCase.computeSafestRoute(startLat, startLng, endLat, endLng);
    }
}
