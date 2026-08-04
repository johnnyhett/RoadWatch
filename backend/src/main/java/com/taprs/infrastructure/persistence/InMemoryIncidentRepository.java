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
        return store.get(id);
    }

    @Override
    public void save(Incident incident) {
        store.put(incident.id(), incident);
    }

    @Override
    public void saveAll(List<Incident> incidents) {
        for (Incident i : incidents) {
            store.put(i.id(), i);
        }
    }
}
