package com.taprs.application.port.out;

import com.taprs.domain.model.*;
import java.util.List;
import java.util.Map;

public interface MlEnginePort {
    List<Blackspot> findBlackspots();
    Map<String, Object> generateHeatmap();
    List<AssociationRule> mineAssociations();
    TemporalPattern getTemporalPatterns();
    RiskPrediction predictRisk(double lat, double lng, String time, String weather);
    RiskPrediction predictRisk(Map<String, Object> features);
    RouteComparison computeSafestRoute(double startLat, double startLng, double endLat, double endLng, double alpha, double beta);
}
