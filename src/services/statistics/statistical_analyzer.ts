import { query } from "../db";

export interface StatisticalSummary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  skewness: number;
  kurtosis: number;
  outliers: number[];
}

export interface TrendLine {
  slope: number;
  intercept: number;
  rSquared: number;
  projectedValues: number[];
}

export interface CorrelationResult {
  coefficient: number;
  pValue: number;
  strength: string;
}

export interface DistributionResult {
  bins: number[];
  frequencies: number[];
  binCount: number;
}

export interface AnomalyResult {
  index: number;
  value: number;
  zScore: number;
  severity: string;
}

export class StatisticalAnalyzerService {
  async analyze(data: number[]): Promise<StatisticalSummary> {
    if (data.length === 0) throw new Error("data slice is empty");

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const sum = data.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const median = this.percentile(sorted, 50);
    const q1 = this.percentile(sorted, 25);
    const q3 = this.percentile(sorted, 75);
    const min = sorted[0];
    const max = sorted[n - 1];

    let skewness = 0;
    let kurtosis = 0;
    if (stdDev > 0) {
      skewness = data.reduce((s, v) => s + ((v - mean) / stdDev) ** 3, 0) / n;
      kurtosis = data.reduce((s, v) => s + ((v - mean) / stdDev) ** 4, 0) / n - 3;
    }

    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = data.filter((v) => v < lowerBound || v > upperBound);

    return { count: n, sum, mean, median, stdDev, variance, min, max, q1, q3, skewness, kurtosis, outliers };
  }

  async computeTrend(x: number[], y: number[], projectSteps = 5): Promise<TrendLine> {
    if (x.length !== y.length || x.length === 0) throw new Error("x and y must have the same non-zero length");

    const n = x.length;
    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      den += (x[i] - meanX) ** 2;
    }

    if (den === 0) throw new Error("x values are constant; cannot compute trend line");

    const slope = num / den;
    const intercept = meanY - slope * meanX;

    const ssTot = y.reduce((s, v) => s + (v - meanY) ** 2, 0);
    const ssRes = y.reduce((s, v, i) => s + (v - (slope * x[i] + intercept)) ** 2, 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    const lastX = x[n - 1];
    const projectedValues: number[] = [];
    for (let i = 1; i <= projectSteps; i++) {
      projectedValues.push(slope * (lastX + i) + intercept);
    }

    return { slope, intercept, rSquared, projectedValues };
  }

  async computeCorrelation(x: number[], y: number[]): Promise<CorrelationResult> {
    if (x.length !== y.length || x.length < 3) throw new Error("x and y must have the same length >= 3");

    const n = x.length;
    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;

    let cov = 0, varX = 0, varY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      cov += dx * dy;
      varX += dx ** 2;
      varY += dy ** 2;
    }

    const den = Math.sqrt(varX * varY);
    if (den === 0) throw new Error("no variance in one or both datasets");

    const coefficient = cov / den;
    const tStat = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const df = n - 2;
    const pValue = 2 * (1 - this.studentTCDF(Math.abs(tStat), df));

    let strength: string;
    const absR = Math.abs(coefficient);
    if (absR >= 0.8) strength = "very strong";
    else if (absR >= 0.6) strength = "strong";
    else if (absR >= 0.4) strength = "moderate";
    else if (absR >= 0.2) strength = "weak";
    else strength = "very weak";

    return { coefficient, pValue, strength };
  }

  async computeDistribution(data: number[], binCount = 10): Promise<DistributionResult> {
    if (data.length === 0) throw new Error("data slice is empty");
    if (binCount <= 0) binCount = 10;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    if (range === 0) {
      return { bins: [min], frequencies: [data.length], binCount: 1 };
    }

    const binWidth = range / binCount;
    const bins: number[] = [];
    const frequencies: number[] = new Array(binCount).fill(0);

    for (let i = 0; i < binCount; i++) {
      bins.push(min + i * binWidth);
    }

    for (const v of data) {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      frequencies[idx]++;
    }

    return { bins, frequencies, binCount };
  }

  async detectAnomalies(data: number[], threshold = 3): Promise<AnomalyResult[]> {
    if (data.length === 0) throw new Error("data slice is empty");

    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const stdDev = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length);

    const anomalies: AnomalyResult[] = [];
    for (let i = 0; i < data.length; i++) {
      if (stdDev === 0) continue;
      const zScore = (data[i] - mean) / stdDev;
      if (Math.abs(zScore) > threshold) {
        let severity: string;
        const absZ = Math.abs(zScore);
        if (absZ > 4) severity = "critical";
        else if (absZ > 3.5) severity = "severe";
        else severity = "moderate";

        anomalies.push({ index: i, value: data[i], zScore, severity });
      }
    }

    return anomalies;
  }

  async persistAnalysisResult(
    datasetID: string,
    summary: StatisticalSummary,
    anomalies: AnomalyResult[]
  ): Promise<void> {
    await query(
      `INSERT INTO public.analysis_results (dataset_id, analysis_type, summary_json, anomalies_json, created_at)
       VALUES ($1, 'statistical', $2, $3, NOW())`,
      [datasetID, JSON.stringify(summary), JSON.stringify(anomalies)]
    );
  }

  async getAnalysisHistory(datasetID: string, limit = 50): Promise<any[]> {
    const result = await query(
      `SELECT id, analysis_type, summary_json, anomalies_json, created_at
       FROM public.analysis_results WHERE dataset_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [datasetID, limit]
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      analysisType: r.analysis_type,
      summary: typeof r.summary_json === "string" ? JSON.parse(r.summary_json) : r.summary_json,
      anomalies: typeof r.anomalies_json === "string" ? JSON.parse(r.anomalies_json) : r.anomalies_json,
      createdAt: r.created_at,
    }));
  }

  private percentile(sorted: number[], p: number): number {
    const n = sorted.length;
    const k = (p / 100) * (n - 1);
    const f = Math.floor(k);
    const c = Math.ceil(k);
    if (f === c) return sorted[f];
    return sorted[f] * (c - k) + sorted[c] * (k - f);
  }

  private studentTCDF(t: number, df: number): number {
    const x = df / (df + t * t);
    let result = 0.5;
    const ib = this.regularizedBeta(x, df / 2, 0.5);
    if (t >= 0) result = 1 - 0.5 * ib;
    else result = 0.5 * ib;
    return result;
  }

  private regularizedBeta(x: number, a: number, b: number): number {
    if (x < 0 || x > 1) return 0;
    if (x === 0 || x === 1) return x;
    const lb = this.logBeta(a, b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lb) / a;
    const alg = this.contFrac(a, b, x);
    return front * alg;
  }

  private logBeta(a: number, b: number): number {
    return this.lgamma(a) + this.lgamma(b) - this.lgamma(a + b);
  }

  private lgamma(z: number): number {
    // Stirling's approximation for log gamma
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = z;
    let x = z + 5.5;
    x -= (z + 0.5) * Math.log(x);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) {
      y += 1;
      ser += c[j] / y;
    }
    return -x + Math.log(2.5066282746310005 * ser / z);
  }

  private contFrac(a: number, b: number, x: number, maxIter = 200): number {
    const eps = 1e-10;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    if (Math.abs(d) < eps) d = eps;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= maxIter; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < eps) d = eps;
      c = 1 + aa / c;
      if (Math.abs(c) < eps) c = eps;
      d = 1 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < eps) d = eps;
      c = 1 + aa / c;
      if (Math.abs(c) < eps) c = eps;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < eps) break;
    }
    return h;
  }
}
