package com.taprs.infrastructure.persistence;

import com.taprs.domain.model.Incident;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class InMemoryIncidentRepositoryTest {

    private static Incident withId(String id) {
        return new Incident(id, 6.6885, -1.6244, "2026-01-01T12:00:00", 3,
            1, 1, "Clear", "Dry", "Daylight", "A_Road", 50,
            "Not_At_Junction", List.of("Car"), List.of("Speeding"));
    }

    @Test
    @DisplayName("a record with no accident_id is skipped instead of aborting the load")
    void nullIdIsSkippedNotFatal() {
        InMemoryIncidentRepository repository = new InMemoryIncidentRepository();

        // ConcurrentHashMap forbids null keys, so an un-guarded put would throw
        // and abandon every remaining record in the batch.
        assertThatCode(() -> repository.saveAll(Arrays.asList(withId("a"), withId(null), withId("b"))))
            .doesNotThrowAnyException();

        assertThat(repository.findAll()).hasSize(2);
        assertThat(repository.findAll()).extracting(Incident::id).containsExactlyInAnyOrder("a", "b");
    }

    @Test
    @DisplayName("findById tolerates a null id")
    void findByIdTolerartesNull() {
        InMemoryIncidentRepository repository = new InMemoryIncidentRepository();
        repository.save(withId("a"));

        assertThat(repository.findById(null)).isNull();
        assertThat(repository.findById("missing")).isNull();
        assertThat(repository.findById("a")).isNotNull();
    }

    @Test
    @DisplayName("saving the same id twice replaces rather than duplicates")
    void saveIsIdempotentPerId() {
        InMemoryIncidentRepository repository = new InMemoryIncidentRepository();
        repository.save(withId("a"));
        repository.save(withId("a"));

        assertThat(repository.findAll()).hasSize(1);
    }
}
