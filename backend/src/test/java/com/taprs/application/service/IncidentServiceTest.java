package com.taprs.application.service;

import com.taprs.domain.model.Incident;
import com.taprs.infrastructure.persistence.InMemoryIncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class IncidentServiceTest {

    private InMemoryIncidentRepository repository;
    private IncidentService service;

    private static Incident incident(String id, int severity, int casualties) {
        return new Incident(id, 6.6885, -1.6244, "2026-01-01T12:00:00", severity,
            1, casualties, "Clear", "Dry", "Daylight", "A_Road", 50,
            "Not_At_Junction", List.of("Car"), List.of("Speeding"));
    }

    @BeforeEach
    void setUp() {
        repository = new InMemoryIncidentRepository();
        service = new IncidentService(repository);
    }

    @Test
    @DisplayName("aggregate stats use the snake_case keys the web client reads")
    void statsUseSnakeCaseKeys() {
        repository.saveAll(List.of(incident("a", 1, 2), incident("b", 3, 1)));

        Map<String, Object> stats = service.getAggregateStats();

        // Jackson's SNAKE_CASE strategy does not rewrite Map keys, so these must
        // already match the IncidentStats contract.
        assertThat(stats).containsKeys(
            "total", "total_incidents", "by_severity", "by_weather",
            "by_road_type", "by_light_condition", "total_casualties", "average_severity");
        assertThat(stats).doesNotContainKeys("bySeverity", "totalCasualties", "byWeather");
    }

    @Test
    @DisplayName("severity labels match the palette keys used by the client")
    void severityLabelsMatchClientPalette() {
        repository.saveAll(List.of(
            incident("fatal", 1, 1), incident("serious", 2, 1),
            incident("slight", 3, 1), incident("damage", 4, 0)));

        @SuppressWarnings("unchecked")
        Map<String, Long> bySeverity = (Map<String, Long>) service.getAggregateStats().get("by_severity");

        assertThat(bySeverity).containsOnlyKeys("Fatal", "Serious", "Slight", "Damage Only");
    }

    @Test
    @DisplayName("totals and averages are computed from the stored incidents")
    void totalsAreComputedFromStoredIncidents() {
        repository.saveAll(List.of(incident("a", 1, 3), incident("b", 3, 2), incident("c", 4, 1)));

        Map<String, Object> stats = service.getAggregateStats();

        assertThat(stats.get("total")).isEqualTo(3);
        assertThat(stats.get("total_incidents")).isEqualTo(3);
        assertThat(stats.get("total_casualties")).isEqualTo(6);
        assertThat((Double) stats.get("average_severity")).isEqualTo(2.67);
    }

    @Test
    @DisplayName("an empty repository yields zeroed stats rather than throwing")
    void emptyRepositoryYieldsZeroedStats() {
        Map<String, Object> stats = service.getAggregateStats();

        assertThat(stats.get("total")).isEqualTo(0);
        assertThat(stats.get("total_casualties")).isEqualTo(0);
        assertThat((Double) stats.get("average_severity")).isEqualTo(0.0);
    }
}
