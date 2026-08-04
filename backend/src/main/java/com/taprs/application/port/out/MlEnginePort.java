package com.taprs.application.port.out;

import com.taprs.domain.model.Blackspot;
import com.taprs.domain.model.AssociationRule;
import com.taprs.domain.model.RiskPrediction;
import com.taprs.domain.model.SafetyRoute;
import com.taprs.domain.model.TemporalPattern;
import java.util.List;
import java.util.Map;

public interface MlEnginePort {
    List<Blackspot> findBlackspots();
    Map<String, Object> generateHeatmap();
    List<AssociationRule> mineAssociations();
    TemporalPattern getTemporalPatterns();
    RiskPrediction predictRisk(double lat, double lng, String time, String weather);
    SafetyRoute computeSafestRoute(double startLat, double startLng, double endLat, double endLng);
}
