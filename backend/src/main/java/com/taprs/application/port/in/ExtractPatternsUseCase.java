package com.taprs.application.port.in;

import com.taprs.domain.model.Blackspot;
import com.taprs.domain.model.AssociationRule;
import com.taprs.domain.model.TemporalPattern;
import java.util.List;
import java.util.Map;

public interface ExtractPatternsUseCase {
    List<Blackspot> getBlackspots();
    Map<String, Object> getHeatmap();
    List<AssociationRule> getAssociations();
    TemporalPattern getTemporalPatterns();
}
