package com.taprs.infrastructure.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.domain.model.Incident;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    /**
     * Locations tried in order. A single relative path only resolves when the
     * process happens to be started from {@code backend/}; a packaged jar run
     * from the repository root, or from anywhere else, would silently load
     * nothing and serve an empty dataset.
     */
    private static final String[] CANDIDATE_PATHS = {
        "../data/synthetic_traffic_accidents.json",
        "data/synthetic_traffic_accidents.json",
        "../../data/synthetic_traffic_accidents.json"
    };

    private final IncidentRepositoryPort repository;
    private final ObjectMapper objectMapper;
    private final String configuredPath;

    public DataLoader(IncidentRepositoryPort repository,
                      ObjectMapper objectMapper,
                      @Value("${roadwatch.dataset-path:}") String configuredPath) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.configuredPath = configuredPath;
    }

    private File resolveDataFile() {
        if (configuredPath != null && !configuredPath.isBlank()) {
            File explicit = new File(configuredPath);
            if (explicit.exists()) {
                return explicit;
            }
            log.warn("Configured dataset path does not exist: {}", explicit.getAbsolutePath());
        }
        for (String candidate : CANDIDATE_PATHS) {
            File file = new File(candidate);
            if (file.exists()) {
                return file;
            }
        }
        return null;
    }

    @Override
    public void run(String... args) {
        File dataFile = resolveDataFile();
        if (dataFile == null) {
            log.warn("Incident dataset not found; starting with an empty repository. "
                + "Set roadwatch.dataset-path to load one.");
            return;
        }

        try {
            List<Incident> incidents = objectMapper.readValue(dataFile, new TypeReference<List<Incident>>() {});
            repository.saveAll(incidents);
            log.info("Loaded {} incidents from {}", incidents.size(), dataFile.getAbsolutePath());
        } catch (Exception ex) {
            // A malformed dataset must not prevent the API from starting; the
            // endpoints degrade to an empty horizon instead.
            log.error("Failed to parse incident dataset at {}: {}", dataFile.getAbsolutePath(), ex.getMessage());
        }
    }
}
