export function evaluateVisibility(
  rule: Record<string, any>,
  data: Record<string, any>
): boolean {
  if (!rule || Object.keys(rule).length === 0) return true;

  if ("and" in rule) return evalCompound("and", rule["and"], data);
  if ("or" in rule) return evalCompound("or", rule["or"], data);

  return evalSimple(rule, data);
}

function evalCompound(
  op: string,
  raw: any,
  data: Record<string, any>
): boolean {
  if (!Array.isArray(raw)) {
    throw new Error(`visibility_rule: '${op}' must be an array`);
  }

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== "object" || item === null) {
      throw new Error(`visibility_rule: '${op}' item ${i} is not an object`);
    }
    const result = evaluateVisibility(item, data);
    if (op === "and" && !result) return false;
    if (op === "or" && result) return true;
  }

  return op === "and";
}

function evalSimple(
  rule: Record<string, any>,
  data: Record<string, any>
): boolean {
  const field = rule["field"];
  if (typeof field !== "string" || !field) {
    throw new Error("visibility_rule: missing or invalid 'field'");
  }

  const operator = rule["operator"];
  if (typeof operator !== "string" || !operator) {
    throw new Error("visibility_rule: missing or invalid 'operator'");
  }

  if (!("value" in rule)) {
    throw new Error("visibility_rule: missing 'value'");
  }

  const ruleValue = rule["value"];
  const dataValue = data[field];

  if (dataValue === undefined) return false;

  switch (operator.toLowerCase()) {
    case "eq":
      return deepEqual(dataValue, ruleValue);
    case "ne":
      return !deepEqual(dataValue, ruleValue);
    case "gt": {
      const [a, b] = toFloat(dataValue, ruleValue);
      return a > b;
    }
    case "gte": {
      const [a, b] = toFloat(dataValue, ruleValue);
      return a >= b;
    }
    case "lt": {
      const [a, b] = toFloat(dataValue, ruleValue);
      return a < b;
    }
    case "lte": {
      const [a, b] = toFloat(dataValue, ruleValue);
      return a <= b;
    }
    case "contains": {
      if (typeof dataValue !== "string") {
        throw new Error("visibility_rule: 'contains' requires a string field value");
      }
      if (typeof ruleValue !== "string") {
        throw new Error("visibility_rule: 'contains' requires a string rule value");
      }
      return dataValue.includes(ruleValue);
    }
    case "in": {
      if (!Array.isArray(ruleValue)) {
        throw new Error("visibility_rule: 'in' value must be an array");
      }
      for (const item of ruleValue) {
        if (deepEqual(dataValue, item)) return true;
      }
      return false;
    }
    default:
      throw new Error(`visibility_rule: unknown operator '${operator}'`);
  }
}

function toFloat(a: any, b: any): [number, number] {
  const fa = toFloat64(a);
  if (fa === undefined) {
    throw new Error(`visibility_rule: cannot compare non-numeric value '${String(a)}'`);
  }
  const fb = toFloat64(b);
  if (fb === undefined) {
    throw new Error(`visibility_rule: cannot compare non-numeric rule value '${String(b)}'`);
  }
  return [fa, fb];
}

function toFloat64(v: any): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}
