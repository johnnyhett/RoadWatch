/** Presentation helpers shared across the dashboard panels. */

/**
 * Turns an ingestion enum such as `Drink_Driving` into `Drink Driving`.
 * The open-data schemas use underscored codes, which read as raw data in the UI.
 */
export function humanizeFactor(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  return value.replace(/_/g, ' ').trim();
}

/**
 * Rounds a computed metric for display. Cluster averages arrive as full
 * floating-point values (e.g. 3.111111111111111), which overflow their label.
 */
export function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toFixed(digits);
}

/** Rounds a score to a whole number for compact display. */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return String(Math.round(value));
}
