package com.taprs.infrastructure.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.domain.model.Incident;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    private final IncidentRepositoryPort repository;
    private final ObjectMapper objectMapper;

    public DataLoader(IncidentRepositoryPort repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        File dataFile = new File("../data/synthetic_traffic_accidents.json");
        if (dataFile.exists()) {
            List<Incident> incidents = objectMapper.readValue(dataFile, new TypeReference<List<Incident>>() {});
            repository.saveAll(incidents);
            System.out.println("Loaded " + incidents.size() + " incidents from synthetic data.");
        } else {
            System.out.println("Data file not found at " + dataFile.getAbsolutePath());
        }
    }
}
