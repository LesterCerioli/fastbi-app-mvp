const STRIPPED_KEYS = new Set([
  "id", "organization_id", "kpi_id", "template_id", "dataset_id",
]);

export function sanitize<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(sanitize) as unknown as T;
  }
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!STRIPPED_KEYS.has(key)) {
        result[key] = sanitize(value);
      }
    }
    return result as T;
  }
  return obj;
}
