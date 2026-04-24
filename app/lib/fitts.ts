export type DeviceType = "mouse" | "touch" | "stylus" | "trackpad";

export interface FittsResult {
  id: number;
  time: number;
  rating: RatingLevel;
  color: string;
  bgColor: string;
  label: string;
  steps: string;
}

export type RatingLevel = "trivial" | "easy" | "moderate" | "difficult" | "extreme";

export interface ScenarioInput {
  id: string;
  name: string;
  device: DeviceType;
  distance: number;
  targetSize: number;
  context: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  scenario: ScenarioInput;
  result: FittsResult;
}

const DEVICE_CONSTANTS: Record<DeviceType, { a: number; b: number; label: string }> = {
  mouse:    { a: 0, b: 100, label: "Mouse" },
  touch:    { a: 0, b: 130, label: "Touch" },
  stylus:   { a: 0, b: 115, label: "Stylus" },
  trackpad: { a: 0, b: 110, label: "Trackpad" },
};

const RATINGS: Record<RatingLevel, { label: string; color: string; bgColor: string; minId: number }> = {
  trivial:  { label: "Trivial",   color: "#1DB877", bgColor: "rgba(29,184,119,0.1)",  minId: 0 },
  easy:     { label: "Easy",      color: "#7cbd2a", bgColor: "rgba(124,189,42,0.1)",  minId: 2 },
  moderate: { label: "Moderate",  color: "#E5A040", bgColor: "rgba(229,160,64,0.1)",  minId: 3 },
  difficult:{ label: "Difficult", color: "#E07040", bgColor: "rgba(224,112,64,0.1)",  minId: 4 },
  extreme:  { label: "Extreme",   color: "#D94F4F", bgColor: "rgba(217,79,79,0.1)",   minId: 5 },
};

export function getRating(id: number): { level: RatingLevel } & typeof RATINGS[RatingLevel] {
  if (id < 2) return { level: "trivial",   ...RATINGS.trivial };
  if (id < 3) return { level: "easy",      ...RATINGS.easy };
  if (id < 4) return { level: "moderate",  ...RATINGS.moderate };
  if (id < 5) return { level: "difficult", ...RATINGS.difficult };
  return      { level: "extreme",          ...RATINGS.extreme };
}

export function calculate(device: DeviceType, distance: number, targetSize: number): FittsResult {
  const { a, b } = DEVICE_CONSTANTS[device];
  const ratio = (2 * distance) / targetSize;
  const id = Math.max(0, Math.log2(ratio));
  const time = Math.round(a + b * id);
  const rating = getRating(id);

  const steps =
    `ID = log₂(2 × ${distance} ÷ ${targetSize}) = log₂(${(2 * distance / targetSize).toFixed(2)}) = ${id.toFixed(3)} bits\n` +
    `T  = ${a} + ${b} × ${id.toFixed(3)} = ${time}ms`;

  return {
    id: parseFloat(id.toFixed(3)),
    time,
    rating: rating.level,
    color: rating.color,
    bgColor: rating.bgColor,
    label: rating.label,
    steps,
  };
}

export function getDeviceLabel(d: DeviceType) {
  return DEVICE_CONSTANTS[d].label;
}

export function getSuggestions(result: FittsResult, input: ScenarioInput): string[] {
  const suggestions: string[] = [];
  const { id, time } = result;
  const { distance, targetSize, device } = input;

  if (id >= 4) {
    suggestions.push(`Target size is too small at ${targetSize}px. Increase to at least ${Math.round(targetSize * 1.8)}px to bring ID under 3.5 bits.`);
  }
  if (distance > 400 && device === "touch") {
    suggestions.push(`Distance of ${distance}px exceeds comfortable thumb reach (~350px). Move this target closer to the user's natural hand position.`);
  }
  if (targetSize < 44 && device === "touch") {
    suggestions.push(`${targetSize}px is below the WCAG 2.5.5 minimum touch target of 44px. Users will frequently misclick — especially on small screens.`);
  }
  if (targetSize < 24 && device === "mouse") {
    suggestions.push(`${targetSize}px is tiny even for mouse. Add invisible padding to bring the hitbox to at least 32–40px without changing visual appearance.`);
  }
  if (id >= 3 && id < 4) {
    suggestions.push(`ID of ${id.toFixed(2)} bits is acceptable but approaching friction. If this is a primary or high-frequency action, push W to ${Math.round(targetSize * 1.4)}px.`);
  }
  if (distance > 600) {
    suggestions.push(`Distance of ${distance}px is very far. Consider repositioning this element closer to where the interaction naturally starts.`);
  }
  if (time > 400) {
    suggestions.push(`${time}ms movement time is noticeable. Users doing this action repeatedly will feel the slowness accumulate. Target under 300ms for frequent actions.`);
  }
  if (id <= 2) {
    suggestions.push(`ID of ${id.toFixed(2)} bits — this target is well-sized and well-placed. No changes needed.`);
  }
  if (device === "touch" && targetSize >= 44 && id < 3) {
    suggestions.push(`Good touch ergonomics. Target meets minimum size guidelines and the difficulty is low.`);
  }

  return suggestions.length > 0 ? suggestions : ["Parameters are within acceptable range for this device type."];
}

export function generateChartData(device: DeviceType, currentW: number) {
  const { b } = DEVICE_CONSTANTS[device];
  const distances = Array.from({ length: 76 }, (_, i) => 20 + i * 10);

  const widths = [
    { w: 16,  label: "W=16px (icon xs)",   color: "#D94F4F" },
    { w: currentW, label: `W=${currentW}px (current)`, color: "#7c6dfa" },
    { w: 44,  label: "W=44px (WCAG min)",  color: "#E5A040" },
    { w: 120, label: "W=120px (row target)", color: "#1DB877" },
  ].filter((v, i, arr) => arr.findIndex(x => x.w === v.w) === i);

  return {
    distances,
    series: widths.map(({ w, label, color }) => ({
      label,
      color,
      data: distances.map(d => {
        const id = Math.max(0, Math.log2((2 * d) / w));
        return Math.round(b * id);
      }),
    })),
  };
}
