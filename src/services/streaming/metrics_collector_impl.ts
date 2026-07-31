import { EventBusImpl, Topic, EventType, StreamEvent } from "./event_bus_impl";

const METRICS_RING_SIZE = 10_000;

interface MetricPoint {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
}

export interface PathMetric {
  path: string;
  count: number;
  avgMs: number;
}

export interface MetricsSnapshot {
  timestamp: Date;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  statusCodes: Record<string, number>;
  topPaths: PathMetric[];
}

export class MetricsCollectorImpl {
  private points: MetricPoint[] = new Array(METRICS_RING_SIZE);
  private head = 0;
  private count = 0;
  private activeConnections = 0;
  private tickerHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private eventBus: EventBusImpl) {}

  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    latencyMs: number,
  ): void {
    this.points[this.head] = {
      timestamp: new Date(),
      method,
      path,
      statusCode,
      latencyMs,
    };
    this.head = (this.head + 1) % METRICS_RING_SIZE;
    if (this.count < METRICS_RING_SIZE) {
      this.count++;
    }
  }

  setActiveConnections(n: number): void {
    this.activeConnections = n;
  }

  snapshot(): MetricsSnapshot {
    const cutoff = new Date(Date.now() - 60_000);
    const latencies: number[] = [];
    const statusCodes: Record<string, number> = {};
    const pathCounts: Record<string, number> = {};
    const pathLatency: Record<string, number> = {};
    let total = 0;
    let errors = 0;

    for (let i = 0; i < this.count; i++) {
      const idx =
        (this.head - 1 - i + METRICS_RING_SIZE) % METRICS_RING_SIZE;
      const p = this.points[idx];
      if (!p || p.timestamp < cutoff) break;

      latencies.push(p.latencyMs);
      const key = `${p.statusCode}`;
      statusCodes[key] = (statusCodes[key] ?? 0) + 1;
      pathCounts[p.path] = (pathCounts[p.path] ?? 0) + 1;
      pathLatency[p.path] = (pathLatency[p.path] ?? 0) + p.latencyMs;
      total++;
      if (p.statusCode >= 500) errors++;
    }

    latencies.sort((a, b) => a - b);

    let p50 = 0, p95 = 0, p99 = 0, errRate = 0, rpm = 0;
    const n = latencies.length;
    if (n > 0) {
      p50 = latencies[Math.min(Math.max(Math.floor((n * 50) / 100), 0), n - 1)];
      p95 = latencies[Math.min(Math.max(Math.floor((n * 95) / 100), 0), n - 1)];
      p99 = latencies[Math.min(Math.max(Math.floor((n * 99) / 100), 0), n - 1)];
      errRate = (errors / total) * 100;
      rpm = total;
    }

    const pairs = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count, avg: pathLatency[path] / count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      timestamp: new Date(),
      activeConnections: this.activeConnections,
      requestsPerMinute: rpm,
      errorRate: errRate,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      statusCodes,
      topPaths: pairs.map((p) => ({ path: p.path, count: p.count, avgMs: p.avg })),
    };
  }

  startTicker(intervalSeconds: number): void {
    if (intervalSeconds <= 0) intervalSeconds = 5;
    this.tickerHandle = setInterval(() => {
      const snap = this.snapshot();
      const payload: Record<string, unknown> = {
        timestamp: snap.timestamp.toISOString(),
        active_connections: snap.activeConnections,
        requests_per_minute: snap.requestsPerMinute,
        error_rate: snap.errorRate,
        p50_latency_ms: snap.p50LatencyMs,
        p95_latency_ms: snap.p95LatencyMs,
        p99_latency_ms: snap.p99LatencyMs,
        status_codes: snap.statusCodes,
        top_paths: snap.topPaths,
      };
      const event = this.eventBus.newStreamEvent(
        Topic.Metrics,
        EventType.MetricTick,
        "",
        payload,
      );
      this.eventBus.publish(Topic.Metrics, event);
    }, intervalSeconds * 1000);
  }

  stopTicker(): void {
    if (this.tickerHandle) {
      clearInterval(this.tickerHandle);
      this.tickerHandle = null;
    }
  }
}
