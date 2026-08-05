package com.taprs.infrastructure.web.websocket;

import com.taprs.application.port.out.IncidentRepositoryPort;
import com.taprs.domain.model.Incident;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

/**
 * Broadcasts simulated live traffic incidents every 5 seconds via WebSocket STOMP.
 *
 * <p>Hotspot centres are sampled from the incidents actually loaded into the
 * repository, so the live ticker stays in the same geography as the ingested
 * data horizon instead of being pinned to one hard-coded city.
 */
@Component
public class IncidentStreamHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final IncidentRepositoryPort incidentRepository;
    private final Random random = new Random();

    private static final String[] WEATHER_OPTIONS = {"Clear", "Raining", "Fog", "Overcast"};
    private static final String[] SURFACE_OPTIONS = {"Dry", "Wet", "Ice"};
    private static final String[] LIGHT_OPTIONS = {"Daylight", "Darkness_Lit", "Darkness_Unlit"};
    private static final String[] ROAD_OPTIONS = {"Motorway", "A_Road", "B_Road", "Residential"};
    private static final String[] JUNCTION_OPTIONS = {"Not_At_Junction", "Roundabout", "Crossroads", "T_Junction"};
    private static final String[] FACTOR_OPTIONS = {"Speeding", "Distraction", "Drink_Driving", "Fatigue", "Weather_Related"};
    private static final String[] VEHICLE_OPTIONS = {"Car", "Motorcycle", "HGV", "Van", "Bicycle"};

    // Used only until the repository has finished loading the data horizon.
    private static final double[] DEFAULT_HOTSPOT = {6.6885, -1.6244}; // Kumasi, Ghana

    public IncidentStreamHandler(SimpMessagingTemplate messagingTemplate,
                                 IncidentRepositoryPort incidentRepository) {
        this.messagingTemplate = messagingTemplate;
        this.incidentRepository = incidentRepository;
    }

    /**
     * Picks a hotspot centre from a real loaded incident, falling back to the
     * default centre while the repository is still empty.
     */
    private double[] pickHotspot() {
        List<Incident> loaded = incidentRepository.findAll();
        if (loaded.isEmpty()) {
            return DEFAULT_HOTSPOT;
        }
        Incident seed = loaded.get(random.nextInt(loaded.size()));
        return new double[]{seed.latitude(), seed.longitude()};
    }

    @Scheduled(fixedRate = 5000)
    public void broadcastNewIncident() {
        String eventId = UUID.randomUUID().toString();

        // Sample a hotspot from the ingested data and add Gaussian noise
        double[] hotspot = pickHotspot();
        double lat = hotspot[0] + random.nextGaussian() * 0.005;
        double lng = hotspot[1] + random.nextGaussian() * 0.005;

        int severity = pickWeightedSeverity();
        int numVehicles = 1 + random.nextInt(3);
        int numCasualties = severity <= 2 ? 1 + random.nextInt(3) : random.nextInt(2);

        Incident simulatedIncident = new Incident(
            eventId,
            lat,
            lng,
            Instant.now().toString(),
            severity,
            numVehicles,
            numCasualties,
            WEATHER_OPTIONS[random.nextInt(WEATHER_OPTIONS.length)],
            SURFACE_OPTIONS[random.nextInt(SURFACE_OPTIONS.length)],
            LIGHT_OPTIONS[random.nextInt(LIGHT_OPTIONS.length)],
            ROAD_OPTIONS[random.nextInt(ROAD_OPTIONS.length)],
            pickSpeedLimit(),
            JUNCTION_OPTIONS[random.nextInt(JUNCTION_OPTIONS.length)],
            pickRandomSubset(VEHICLE_OPTIONS, 1 + random.nextInt(2)),
            pickRandomSubset(FACTOR_OPTIONS, 1 + random.nextInt(2))
        );

        String predictedSeverity = switch (severity) {
            case 1 -> "CRITICAL";
            case 2 -> "HIGH";
            case 3 -> "MEDIUM";
            default -> "LOW";
        };

        Map<String, Object> message = new HashMap<>();
        message.put("eventId", eventId);
        message.put("type", "NEW_INCIDENT");
        message.put("incident", simulatedIncident);
        message.put("predictedSeverity", predictedSeverity);
        message.put("timestamp", Instant.now().toString());

        messagingTemplate.convertAndSend("/topic/incidents/live", message);
        messagingTemplate.convertAndSend("/topic/telemetry/live", message);
    }

    private int pickWeightedSeverity() {
        double roll = random.nextDouble();
        if (roll < 0.03) return 1;       // Fatal
        if (roll < 0.15) return 2;       // Serious
        if (roll < 0.60) return 3;       // Slight
        return 4;                         // Damage Only
    }

    private int pickSpeedLimit() {
        int[] limits = {20, 30, 40, 50, 60, 70};
        return limits[random.nextInt(limits.length)];
    }

    private List<String> pickRandomSubset(String[] options, int count) {
        List<String> pool = new ArrayList<>(Arrays.asList(options));
        Collections.shuffle(pool);
        return pool.subList(0, Math.min(count, pool.size()));
    }
}
