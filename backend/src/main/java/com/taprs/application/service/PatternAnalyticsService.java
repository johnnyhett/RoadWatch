package com.taprs.application.service;

import com.taprs.application.port.in.ExtractPatternsUseCase;
import com.taprs.application.port.out.MlEnginePort;
import com.taprs.domain.model.AssociationRule;
import com.taprs.domain.model.Blackspot;
import com.taprs.domain.model.TemporalPattern;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PatternAnalyticsService implements ExtractPatternsUseCase {

    private final MlEnginePort mlEnginePort;

    public PatternAnalyticsService(MlEnginePort mlEnginePort) {
        this.mlEnginePort = mlEnginePort;
    }

    @Override
    public List<Blackspot> getBlackspots() {
        return mlEnginePort.findBlackspots();
    }

    @Override
    public Map<String, Object> getHeatmap() {
        return mlEnginePort.generateHeatmap();
    }

    @Override
    public List<AssociationRule> getAssociations() {
        return mlEnginePort.mineAssociations();
    }

    @Override
    public TemporalPattern getTemporalPatterns() {
        return mlEnginePort.getTemporalPatterns();
    }
}
