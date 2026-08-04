// ─── Core Domain Types ────────────────────────────────────────────

export interface Incident {
  accident_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  severity: number; // 1=Fatal, 2=Serious, 3=Slight, 4=Damage_Only
  num_vehicles: number;
  num_casualties: number;
  weather_condition: string;
  road_surface_condition: string;
  light_condition: string;
  road_classification: string;
  speed_limit: number;
  junction_detail: string;
  vehicle_types: string[];
  contributing_factors: string[];
}

export interface IncidentStats {
  total: number;
  by_severity: Record<string, number>;
  by_weather: Record<string, number>;
  by_road_type: Record<string, number>;
  by_light_condition: Record<string, number>;
  total_casualties: number;
  average_severity: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  accuracy?: number;
  timestamp?: number;
}

// ─── Analytics Types ──────────────────────────────────────────────

export interface Blackspot {
  cluster_id: number;
  center: [number, number];
  bounds: [number, number][];
  incident_count: number;
  avg_severity: number;
  risk_score: number;
  primary_factors: Record<string, number>;
}

export interface HeatmapGrid {
  grid: {
    lat_range: number[];
    lng_range: number[];
    density_matrix: number[][];
  };
}

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface TemporalPatterns {
  hourly_distribution: { hour: number; count: number; avg_severity: number }[];
  daily_distribution: { day: string; count: number; avg_severity: number }[];
  risk_multipliers: Record<string, number>;
}

// ─── Prediction Types ─────────────────────────────────────────────

export interface RiskFeatures {
  weather: string;
  light: string;
  road_type: string;
  speed_limit: number;
  junction?: string;
  hour: number;
  day_of_week: number;
}

export interface RiskPrediction {
  risk_level: string;
  probabilities: Record<string, number>;
  severity_prediction: string;
  risk_score?: number;
  feature_importance?: Record<string, number>;
  recommended_mitigations?: string[];
}

// ─── Routing Types ────────────────────────────────────────────────

export type TravelMode = 'car' | 'motorcycle' | 'bicycle' | 'pedestrian';

export interface RouteParams {
  origin: [number, number];
  destination: [number, number];
  alpha: number; // time weight
  beta: number;  // safety weight
  mode?: TravelMode;
}

export interface RouteComparison {
  safest_route: RouteDetails;
  fastest_route: RouteDetails;
}

export interface RouteDetails {
  path: [number, number][];
  total_risk: number;
  distance_km: number;
  mode?: TravelMode;
}

// ─── Municipal Safety Audit Types ─────────────────────────────────

export interface SafetyAuditRequest {
  jurisdiction?: string;
  startDate?: string;
  endDate?: string;
  minSeverity?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface PriorityIntervention {
  location: string;
  factor: string;
  countermeasure: string;
  estimatedRiskReductionPct: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  costEstimate: string;
  category: 'GEOMETRIC' | 'SURFACE' | 'LIGHTING' | 'SIGNAL' | 'ENFORCEMENT';
}

export interface SafetyAuditReport {
  auditId: string;
  jurisdiction: string;
  auditTimestamp: string;
  totalAccidentsAnalyzed: number;
  blackspotsIdentified: number;
  overallSafetyRating: string;
  safetyScore: number;
  criticalCorridors: string[];
  factorBreakdown: Record<string, number>;
  priorityInterventions: PriorityIntervention[];
  regulatoryComplianceStatus: string;
  summary: string;
}

// ─── WebSocket Types ──────────────────────────────────────────────

export interface LiveIncidentEvent {
  eventId: string;
  type: 'NEW_INCIDENT';
  incident: Incident;
  predictedSeverity: string;
  timestamp: string;
}

// ─── Filter Types ─────────────────────────────────────────────────

export interface IncidentFilters {
  severity?: number[];
  weather?: string[];
  startDate?: string;
  endDate?: string;
}
