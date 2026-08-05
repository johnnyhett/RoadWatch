package com.taprs.infrastructure.web;

import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.domain.model.Incident;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end status-code behaviour over a real servlet container.
 *
 * <p>The ML engine is pointed at a closed port so the downstream-outage paths
 * are exercised deterministically, regardless of whether a real engine happens
 * to be running on the developer's machine.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "ml-engine.base-url=http://localhost:1",
    "ml-engine.timeout-seconds=2"
})
class ApiStatusCodeIntegrationTest {

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private IncidentRepositoryPort repository;

    @BeforeEach
    void seed() {
        repository.save(new Incident("seed-1", 6.6885, -1.6244, "2026-01-01T12:00:00", 2,
            1, 1, "Clear", "Dry", "Daylight", "A_Road", 50,
            "Not_At_Junction", List.of("Car"), List.of("Speeding")));
    }

    @Test
    @DisplayName("an unmapped path is 404, not 500")
    void unmappedPathIsNotFound() {
        // A catch-all @ExceptionHandler(Exception.class) would swallow Spring's
        // own NoResourceFoundException and report this as a server fault.
        assertThat(rest.getForEntity("/api/v1/definitely-not-a-route", String.class).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(rest.getForEntity("/", String.class).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("an unknown incident id is 404, not 200 with an empty body")
    void unknownIncidentIsNotFound() {
        assertThat(rest.getForEntity("/api/v1/incidents/no-such-id", String.class).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("a known incident is returned with snake_case JSON fields")
    void knownIncidentIsReturned() {
        ResponseEntity<Map<String, Object>> response = rest.exchange(
            "/api/v1/incidents/seed-1", org.springframework.http.HttpMethod.GET, null,
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys("accident_id", "latitude", "longitude", "severity");
    }

    @Test
    @DisplayName("stats expose the snake_case contract the web client consumes")
    void statsExposeSnakeCaseContract() {
        ResponseEntity<Map<String, Object>> response = rest.exchange(
            "/api/v1/incidents/stats", org.springframework.http.HttpMethod.GET, null,
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys(
            "total", "by_severity", "by_weather", "by_road_type",
            "by_light_condition", "total_casualties", "average_severity");
    }

    @Test
    @DisplayName("a downstream ML outage is reported as 503, not 500")
    void mlEngineOutageIsServiceUnavailable() {
        assertThat(rest.postForEntity("/api/v1/analytics/blackspots", null, String.class).getStatusCode())
            .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    @DisplayName("the safety audit still answers when the ML engine is unreachable")
    void safetyAuditDegradesGracefully() {
        ResponseEntity<Map<String, Object>> response = rest.exchange(
            "/api/v1/analysis/safety-audit", org.springframework.http.HttpMethod.POST,
            new org.springframework.http.HttpEntity<>(Map.of("jurisdiction", "Kumasi Metro")),
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("jurisdiction", "Kumasi Metro");
        // Blackspots come from the unreachable engine; the rest is local.
        assertThat(response.getBody()).containsEntry("blackspotsIdentified", 0);
        assertThat((Integer) response.getBody().get("totalAccidentsAnalyzed")).isPositive();
    }

    @Test
    @DisplayName("a route request with a partial body does not fault")
    void partialRouteBodyDoesNotFault() {
        // startLatitude without startLongitude previously dereferenced null.
        ResponseEntity<String> response = rest.postForEntity(
            "/api/v1/routes/safest", Map.of("startLatitude", 6.6885), String.class);

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
