package com.taprs.application.port.out;

import com.taprs.domain.model.Incident;
import java.util.List;

public interface IncidentRepositoryPort {
    List<Incident> findAll();
    Incident findById(String id);
    void save(Incident incident);
    void saveAll(List<Incident> incidents);
}
