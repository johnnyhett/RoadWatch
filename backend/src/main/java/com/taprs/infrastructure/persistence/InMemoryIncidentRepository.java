package com.taprs.infrastructure.persistence;

import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.domain.model.Incident;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryIncidentRepository implements IncidentRepositoryPort {

    private final Map<String, Incident> store = new ConcurrentHashMap<>();

    @Override
    public List<Incident> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public Incident findById(String id) {
        // ConcurrentHashMap.get rejects a null key with an NPE.
        return id == null ? null : store.get(id);
    }

    @Override
    public void save(Incident incident) {
        if (incident == null || incident.id() == null) {
            // ConcurrentHashMap forbids null keys, so a record with no
            // accident_id would abort the whole load with an NPE.
            return;
        }
        store.put(incident.id(), incident);
    }

    @Override
    public void saveAll(List<Incident> incidents) {
        if (incidents == null) {
            return;
        }
        for (Incident i : incidents) {
            save(i);
        }
    }
}
