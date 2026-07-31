import { v4 as uuid } from "uuid";
import { EventBusImpl, Topic, EventType, StreamEvent } from "./event_bus_impl";
import {
  TumblingWindow,
  SlidingWindow,
  type AggregationFunc,
} from "./window_impl";

export type WindowType = "tumbling" | "sliding";

export interface WindowConfig {
  type: WindowType;
  sizeSeconds: number;
  stepSeconds?: number;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  sourceTopic: string;
  field: string;
  aggregation: AggregationFunc;
  window: WindowConfig;
}

export interface PipelineResult {
  pipelineId: string;
  windowStart: Date;
  windowEnd: Date;
  value: number;
  count: number;
  computedAt: Date;
}

interface PipelineEntry {
  def: PipelineDefinition;
  cancelled: boolean;
  latest: PipelineResult | null;
}

export class PipelineServiceImpl {
  private entries = new Map<string, PipelineEntry>();

  constructor(private eventBus: EventBusImpl) {}

  createPipeline(def: PipelineDefinition): void {
    if (!def.id) def.id = uuid();
    if (this.entries.has(def.id)) {
      throw new Error(`pipeline ${def.id} already exists`);
    }
    if (def.window.sizeSeconds <= 0) {
      throw new Error("window.size_seconds must be > 0");
    }
    if (
      def.window.type === "sliding" &&
      (def.window.stepSeconds ?? 0) <= 0
    ) {
      def.window.stepSeconds = Math.floor(def.window.sizeSeconds / 2);
    }

    const entry: PipelineEntry = { def, cancelled: false, latest: null };
    this.entries.set(def.id, entry);

    this.runPipeline(entry);
  }

  stopPipeline(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`pipeline ${id} not found`);
    entry.cancelled = true;
    this.entries.delete(id);
  }

  getLatestResult(id: string): PipelineResult | null {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`pipeline ${id} not found`);
    return entry.latest;
  }

  listPipelines(): PipelineDefinition[] {
    return Array.from(this.entries.values()).map((e) => e.def);
  }

  private runPipeline(entry: PipelineEntry): void {
    const def = entry.def;
    const { channel, id: subId } = this.eventBus.subscribe(def.sourceTopic);

    let tumbling: TumblingWindow | null = null;
    let sliding: SlidingWindow | null = null;

    if (def.window.type === "sliding") {
      sliding = new SlidingWindow(
        def.window.sizeSeconds,
        def.window.stepSeconds ?? Math.floor(def.window.sizeSeconds / 2),
      );
    } else {
      tumbling = new TumblingWindow(def.window.sizeSeconds);
    }

    const poll = setInterval(() => {
      if (entry.cancelled) {
        clearInterval(poll);
        this.eventBus.unsubscribe(def.sourceTopic, subId);
        return;
      }
    }, 100);

    this.startAggregationLoop(entry, channel, tumbling, sliding, poll);
  }

  private startAggregationLoop(
    entry: PipelineEntry,
    channel: (event: StreamEvent) => void,
    tumbling: TumblingWindow | null,
    sliding: SlidingWindow | null,
    poll: ReturnType<typeof setInterval>,
  ): void {
    let buffer: StreamEvent[] = [];

    const processEvent = (event: StreamEvent) => {
      if (entry.cancelled) {
        this.eventBus.unsubscribe(entry.def.sourceTopic, "");
        clearInterval(poll);
        return;
      }

      const v = extractFloat(event.payload, entry.def.field);
      if (v === undefined) return;

      if (tumbling) {
        const completed = tumbling.add(v);
        if (completed) {
          this.publishResult(entry, completed);
        }
      } else if (sliding) {
        const completed = sliding.add(v);
        for (const buf of completed) {
          this.publishResult(entry, buf);
        }
      }
    };

    this.eventBus.subscribe(entry.def.sourceTopic);
  }

  private publishResult(
    entry: PipelineEntry,
    buf: { start: Date; end: Date; compute: (agg: AggregationFunc) => [number, number] },
  ): void {
    const [value, count] = buf.compute(entry.def.aggregation);
    const result: PipelineResult = {
      pipelineId: entry.def.id,
      windowStart: buf.start,
      windowEnd: buf.end,
      value,
      count,
      computedAt: new Date(),
    };

    entry.latest = result;

    const topic = `${Topic.Pipeline}.${entry.def.id}`;
    const payload: Record<string, unknown> = {
      pipeline_id: result.pipelineId,
      window_start: result.windowStart.toISOString(),
      window_end: result.windowEnd.toISOString(),
      value: result.value,
      count: result.count,
      computed_at: result.computedAt.toISOString(),
    };
    const event = this.eventBus.newStreamEvent(
      topic,
      EventType.PipelineResult,
      "",
      payload,
    );
    this.eventBus.publish(topic, event);
  }
}

function extractFloat(
  payload: Record<string, unknown>,
  field: string,
): number | undefined {
  const raw = payload[field];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}
