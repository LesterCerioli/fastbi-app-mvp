export function cadenceToExpression(cadence: string): string {
  switch (cadence.toLowerCase().trim()) {
    case "daily":
      return "0 0 * * *";
    case "weekly":
      return "0 0 * * 1";
    case "monthly":
      return "0 0 1 * *";
    case "quarterly":
      return "0 0 1 1,4,7,10 *";
    default:
      return "";
  }
}

export function nextRunTime(
  cronExpr: string,
  timezone: string,
  from: Date
): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function toTZ(d: Date): Date {
    const parts = formatter.formatToParts(d);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
    return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  }

  const fields = cronExpr.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`cron expression must have 5 fields, got ${fields.length} in "${cronExpr}"`);
  }

  const minutes = parseCronField(fields[0], 0, 59);
  const hours = parseCronField(fields[1], 0, 23);
  const daysOfMonth = parseCronField(fields[2], 1, 31);
  const months = parseCronField(fields[3], 1, 12);
  const daysOfWeek = parseCronField(fields[4], 0, 6);

  const domWild = fields[2].trim() === "*";
  const dowWild = fields[4].trim() === "*";

  let t = toTZ(new Date(from.getTime() + 60000));
  t.setSeconds(0, 0);

  const limit = new Date(t.getTime() + 366 * 24 * 60 * 60000);

  while (t < limit) {
    if (!months.has(t.getMonth() + 1)) {
      t = new Date(t.getFullYear(), t.getMonth() + 1, 1, 0, 0, 0, 0);
      continue;
    }

    if (!dayMatches(t, daysOfMonth, daysOfWeek, domWild, dowWild)) {
      t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 0, 0, 0, 0);
      continue;
    }

    if (!hours.has(t.getHours())) {
      t = new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours() + 1, 0, 0, 0);
      continue;
    }

    if (!minutes.has(t.getMinutes())) {
      t = new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), t.getMinutes() + 1, 0, 0);
      continue;
    }

    return t;
  }

  throw new Error(`no run time found within 1 year for cron expression "${cronExpr}"`);
}

function dayMatches(
  t: Date,
  daysOfMonth: Set<number>,
  daysOfWeek: Set<number>,
  domWild: boolean,
  dowWild: boolean
): boolean {
  if (domWild && dowWild) return true;
  if (domWild) return daysOfWeek.has(t.getDay());
  if (dowWild) return daysOfMonth.has(t.getDate());
  return daysOfMonth.has(t.getDate()) || daysOfWeek.has(t.getDay());
}

export function parseCronField(field: string, min: number, max: number): Set<number> {
  const result = new Set<number>();

  if (field.includes("/")) {
    return parseStepField(field, min, max);
  }

  for (const part of field.split(",")) {
    addCronRange(result, part, min, max);
  }

  return result;
}

function parseStepField(field: string, min: number, max: number): Set<number> {
  const result = new Set<number>();
  const parts = field.split("/");
  const step = parseInt(parts[1], 10);
  if (isNaN(step) || step <= 0) {
    throw new Error(`invalid step value "${parts[1]}"`);
  }

  let start: number, end: number;
  const base = parts[0];

  if (base === "*") {
    start = min;
    end = max;
  } else if (base.includes("-")) {
    const rangeParts = base.split("-");
    start = parseInt(rangeParts[0], 10);
    end = parseInt(rangeParts[1], 10);
    if (isNaN(start) || isNaN(end)) {
      throw new Error(`invalid range in "${base}"`);
    }
  } else {
    start = parseInt(base, 10);
    end = max;
    if (isNaN(start)) {
      throw new Error(`invalid step base "${base}"`);
    }
  }

  if (start < min || end > max || start > end) {
    throw new Error(`step range ${start}-${end} out of bounds [${min},${max}]`);
  }

  for (let i = start; i <= end; i += step) {
    result.add(i);
  }
  return result;
}

function addCronRange(
  result: Set<number>,
  part: string,
  min: number,
  max: number
): void {
  if (part === "*") {
    for (let i = min; i <= max; i++) result.add(i);
    return;
  }

  if (part.includes("-")) {
    const rangeParts = part.split("-");
    const start = parseInt(rangeParts[0], 10);
    const end = parseInt(rangeParts[1], 10);
    if (isNaN(start) || isNaN(end)) {
      throw new Error(`invalid range "${part}"`);
    }
    if (start < min || end > max || start > end) {
      throw new Error(`range ${start}-${end} out of bounds [${min},${max}]`);
    }
    for (let i = start; i <= end; i++) result.add(i);
    return;
  }

  const val = parseInt(part, 10);
  if (isNaN(val) || val < min || val > max) {
    throw new Error(`invalid value "${part}"`);
  }
  result.add(val);
}
