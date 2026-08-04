package com.taprs.application.port.in;

import com.taprs.domain.model.Incident;
import java.util.List;
import java.util.Map;

public interface GetIncidentsUseCase {
    List<Incident> getAllIncidents();
    Incident getIncidentById(String id);
    Map<String, Object> getAggregateStats();
}
