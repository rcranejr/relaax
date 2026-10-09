/**
 * Minor-safe serializer. Any key in SENSITIVE_NUMERIC is replaced by a trend token or removed
 * when the requesting session is an athlete under 18 without a health_view grant.
 * Applied once at the gateway so no service can forget.
 */
const SENSITIVE_NUMERIC = new Set(["weightKg", "heightCm", "calories", "macros", "bmi", "bodyFatPct"]);
const TREND_KEYS: Record<string, string> = { weightKg: "weightTrend", heightCm: "heightTrend" };

export function minorSafe<T>(data: T, trends: Record<string, "up" | "steady" | "down"> = {}): T {
  if (Array.isArray(data)) return data.map((d) => minorSafe(d, trends)) as T;
  if (data && typeof data === "object" && !(data instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_NUMERIC.has(k)) {
        const tk = TREND_KEYS[k];
        if (tk) out[tk] = trends[tk] ?? "steady";
        continue;
      }
      out[k] = minorSafe(v, trends);
    }
    return out as T;
  }
  return data;
}
