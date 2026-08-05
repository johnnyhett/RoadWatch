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

        if (request.get("origin") instanceof List<?> origList && origList.size() >= 2) {
            startLat = parseCoordinate(origList.get(0), 0.0);
            startLng = parseCoordinate(origList.get(1), 0.0);
        } else {
            startLat = parseCoordinate(request.get("startLatitude"), 0.0);
            startLng = parseCoordinate(request.get("startLongitude"), 0.0);
        }

        if (request.get("destination") instanceof List<?> destList && destList.size() >= 2) {
            endLat = parseCoordinate(destList.get(0), 0.0);
            endLng = parseCoordinate(destList.get(1), 0.0);
        } else {
            endLat = parseCoordinate(request.get("endLatitude"), 0.0);
            endLng = parseCoordinate(request.get("endLongitude"), 0.0);
        }

        double alpha = parseCoordinate(request.get("alpha"), 0.5);
        double beta = parseCoordinate(request.get("beta"), 0.5);

        return computeRouteUseCase.computeSafestRoute(startLat, startLng, endLat, endLng, alpha, beta);
    }

    /**
     * Tolerant numeric parse: a missing or malformed member yields the default
     * rather than a NullPointerException or NumberFormatException, so a partial
     * request body (for example {@code startLatitude} without
     * {@code startLongitude}) still produces a well-formed response.
     */
    private static double parseCoordinate(Object value, double fallback) {
        if (value == null) {
            return fallback;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}
