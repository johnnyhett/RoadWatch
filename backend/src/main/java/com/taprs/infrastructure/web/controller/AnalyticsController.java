package com.taprs.infrastructure.web.controller;

import com.taprs.application.port.in.ExtractPatternsUseCase;
import com.taprs.domain.model.AssociationRule;
import com.taprs.domain.model.Blackspot;
import com.taprs.domain.model.TemporalPattern;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final ExtractPatternsUseCase extractPatternsUseCase;

    public AnalyticsController(ExtractPatternsUseCase extractPatternsUseCase) {
        this.extractPatternsUseCase = extractPatternsUseCase;
    }

    @PostMapping("/blackspots")
    public List<Blackspot> getBlackspots() {
        return extractPatternsUseCase.getBlackspots();
    }

    @PostMapping("/heatmap")
    public Map<String, Object> getHeatmap() {
        return extractPatternsUseCase.getHeatmap();
    }

    @PostMapping("/associations")
    public List<AssociationRule> getAssociations() {
        return extractPatternsUseCase.getAssociations();
    }

    @GetMapping("/temporal")
    public TemporalPattern getTemporalPatterns() {
        return extractPatternsUseCase.getTemporalPatterns();
    }
}
