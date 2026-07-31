export interface AnomalyResult {
  index: number;
  value: number;
  expectedValue: number;
  zScore: number;
  isAnomaly: boolean;
}

export class AnomalyDetector {
  detectZScore(values: number[], threshold: number): AnomalyResult[] {
    if (values.length === 0) return [];

    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);

    if (stdDev === 0) return [];

    const results: AnomalyResult[] = [];
    for (let i = 0; i < values.length; i++) {
      const zscore = Math.abs((values[i] - mean) / stdDev);
      if (zscore > threshold) {
        results.push({
          index: i,
          value: values[i],
          expectedValue: mean,
          zScore: zscore,
          isAnomaly: true,
        });
      }
    }
    return results;
  }

  detectIQR(values: number[]): AnomalyResult[] {
    if (values.length < 4) return [];

    const sorted = [...values];
    this.quickSort(sorted, 0, sorted.length - 1);

    const q1 = this.percentile(sorted, 0.25);
    const q3 = this.percentile(sorted, 0.75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const results: AnomalyResult[] = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] < lowerBound || values[i] > upperBound) {
        const expected = (q1 + q3) / 2;
        const zscore = Math.abs((values[i] - expected) / iqr);
        results.push({
          index: i,
          value: values[i],
          expectedValue: expected,
          zScore: zscore,
          isAnomaly: true,
        });
      }
    }
    return results;
  }

  detectMovingAverage(values: number[], windowSize: number, threshold: number): AnomalyResult[] {
    if (values.length < windowSize) return [];

    const results: AnomalyResult[] = [];
    for (let i = windowSize; i < values.length; i++) {
      const window = values.slice(i - windowSize, i);
      const mean = this.calculateMean(window);
      const stdDev = this.calculateStdDev(window, mean);

      if (stdDev > 0) {
        const zscore = Math.abs((values[i] - mean) / stdDev);
        if (zscore > threshold) {
          results.push({
            index: i,
            value: values[i],
            expectedValue: mean,
            zScore: zscore,
            isAnomaly: true,
          });
        }
      }
    }
    return results;
  }

  private calculateMean(values: number[]): number {
    let sum = 0;
    for (const v of values) sum += v;
    return sum / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    let variance = 0;
    for (const v of values) variance += Math.pow(v - mean, 2);
    variance /= values.length;
    return Math.sqrt(variance);
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const pos = p * (sorted.length - 1);
    const idx = Math.floor(pos);
    if (idx >= sorted.length - 1) return sorted[sorted.length - 1];
    const frac = pos - idx;
    return sorted[idx] * (1 - frac) + sorted[idx + 1] * frac;
  }

  private quickSort(arr: number[], low: number, high: number): void {
    if (low < high) {
      const pi = this.partition(arr, low, high);
      this.quickSort(arr, low, pi - 1);
      this.quickSort(arr, pi + 1, high);
    }
  }

  private partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (arr[j] <= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }
}
