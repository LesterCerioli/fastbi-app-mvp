export type BindingType = "currency" | "percentage" | "integer" | "text" | "date" | "boolean" | "ratio" | "count";

const sampleTexts = [
  "Sample Organization", "ACME Corp", "Synthetic Data", "Preview Mode",
  "FastBI Report", "Q1 Analysis", "North Region", "Enterprise Plan",
  "Monthly Summary", "Annual Review",
];

function deterministicSeed(a: string, b: string): number {
  let h = 14695981039346656037;
  const prime = 1099511628211;
  const s = a + "|" + b;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, prime);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SyntheticDataGenerator {
  private rng: () => number;

  constructor(orgName: string, templateName: string) {
    const seed = deterministicSeed(orgName, templateName);
    this.rng = mulberry32(seed);
  }

  generateForBinding(bindingType: BindingType): any {
    switch (bindingType) {
      case "currency":
        return Math.floor(this.rng() * 99001 + 1000) + this.rng();
      case "percentage":
        return Math.floor(this.rng() * 101);
      case "integer":
      case "count":
        return Math.floor(this.rng() * 10001);
      case "ratio":
        return this.rng() * 10;
      case "date": {
        const daysAgo = Math.floor(this.rng() * 30);
        const d = new Date(Date.now() - daysAgo * 86400000);
        return d.toISOString().split("T")[0];
      }
      case "boolean":
        return this.rng() >= 0.5;
      default:
        return sampleTexts[Math.floor(this.rng() * sampleTexts.length)];
    }
  }

  generateTimeSeries(n: number, valueType: BindingType): Record<string, any>[] {
    const points: Record<string, any>[] = [];
    const base = new Date(Date.now() - n * 86400000);

    for (let i = 0; i < n; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      points.push({
        date: d.toISOString().split("T")[0],
        value: this.generateForBinding(valueType),
      });
    }

    return points;
  }

  generateKPISummaryData(kpiIDs: any[]): Record<string, any>[] {
    return kpiIDs.map((kpiID: any) => ({
      code: String(kpiID),
      value: this.generateForBinding("currency"),
      target: this.generateForBinding("currency"),
      pct_of_target: this.generateForBinding("percentage"),
      trend: [
        this.generateForBinding("currency"),
        this.generateForBinding("currency"),
        this.generateForBinding("currency"),
      ],
    }));
  }

  generateTableRows(columns: any[], n: number): Record<string, any>[] {
    const rows: Record<string, any>[] = [];
    for (let i = 0; i < n; i++) {
      const row: Record<string, any> = {};
      for (const col of columns) {
        const colName = String(col);
        row[colName] = this.generateForBinding(this.inferType(colName));
      }
      rows.push(row);
    }
    return rows;
  }

  private inferType(colName: string): BindingType {
    const lower = colName.toLowerCase();
    if (/(revenue|amount|price|cost|margin|total|value)/.test(lower)) return "currency";
    if (/(pct|percent|rate|ratio)/.test(lower)) return "percentage";
    if (/(count|qty|quantity|num|number)/.test(lower)) return "count";
    if (/(date|at|on|time)/.test(lower)) return "date";
    return "text";
  }
}
