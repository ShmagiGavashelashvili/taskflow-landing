export interface VelocityPoint {
  week: string;
  value: number;
}

export interface Kpi {
  label: string;
  value: string;
  delta: string;
}

export const VELOCITY: VelocityPoint[] = [
  { week: "W1", value: 42 },
  { week: "W2", value: 55 },
  { week: "W3", value: 48 },
  { week: "W4", value: 66 },
  { week: "W5", value: 72 },
  { week: "W6", value: 84 },
];

export const KPIS: Kpi[] = [
  { label: "Tasks completed", value: "128", delta: "+18%" },
  { label: "On-time rate", value: "94%", delta: "+6%" },
  { label: "Avg. cycle time", value: "3.2d", delta: "-0.8d" },
];

/** SVG polyline points on a 100 × 80 viewBox. */
export const BURNDOWN_IDEAL = "0,10 100,70";
export const BURNDOWN_ACTUAL = "0,10 20,22 40,38 60,44 80,58 100,66";
