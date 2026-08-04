package com.taprs.infrastructure.web.websocket;

import com.taprs.domain.model.Incident;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Broadcasts simulated live traffic incidents every 5 seconds via WebSocket STOMP.
 * Generates incidents within London coordinates to match the synthetic dataset geography.
 */
@Component
public class IncidentStreamHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    private static final String[] WEATHER_OPTIONS = {"Clear", "Raining", "Fog", "Overcast"};
    private static final String[] SURFACE_OPTIONS = {"Dry", "Wet", "Ice"};
    private static final String[] LIGHT_OPTIONS = {"Daylight", "Darkness_Lit", "Darkness_Unlit"};
    private static final String[] ROAD_OPTIONS = {"Motorway", "A_Road", "B_Road", "Residential"};
    private static final String[] JUNCTION_OPTIONS = {"Not_At_Junction", "Roundabout", "Crossroads", "T_Junction"};
    private static final String[] FACTOR_OPTIONS = {"Speeding", "Distraction", "Drink_Driving", "Fatigue", "Weather_Related"};
    private static final String[] VEHICLE_OPTIONS = {"Car", "Motorcycle", "HGV", "Van", "Bicycle"};

    // London hotspot centers for realistic simulation
    private static final double[][] LONDON_HOTSPOTS = {
        {51.5074, -0.1278},  // Westminster
        {51.5155, -0.1419},  // Oxford Circus
        {51.5013, -0.1419},  // Victoria
        {51.5225, -0.0846},  // Old Street
        {51.4975, -0.1357},  // Pimlico
        {51.5194, -0.1270},  // Holborn
    };

    public IncidentStreamHandler(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedRate = 5000)
    public void broadcastNewIncident() {
        String eventId = UUID.randomUUID().toString();

        // Pick a random London hotspot and add Gaussian noise
        double[] hotspot = LONDON_HOTSPOTS[random.nextInt(LONDON_HOTSPOTS.length)];
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
