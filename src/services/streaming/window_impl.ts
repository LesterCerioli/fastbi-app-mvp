export type AggregationFunc = "sum" | "avg" | "count" | "min" | "max";

export class WindowBuffer {
  private values: number[] = [];
  start: Date;
  end: Date;

  constructor(start: Date, end: Date) {
    this.start = start;
    this.end = end;
  }

  add(v: number): void {
    this.values.push(v);
  }

  compute(agg: AggregationFunc): [number, number] {
    const n = this.values.length;
    if (n === 0) return [0, 0];

    switch (agg) {
      case "sum": {
        let sum = 0;
        for (const v of this.values) sum += v;
        return [sum, n];
      }
      case "avg": {
        let sum = 0;
        for (const v of this.values) sum += v;
        return [sum / n, n];
      }
      case "count":
        return [n, n];
      case "min": {
        let min = this.values[0];
        for (let i = 1; i < this.values.length; i++) {
          if (this.values[i] < min) min = this.values[i];
        }
        return [min, n];
      }
      case "max": {
        let max = this.values[0];
        for (let i = 1; i < this.values.length; i++) {
          if (this.values[i] > max) max = this.values[i];
        }
        return [max, n];
      }
      default:
        return [0, 0];
    }
  }
}

export class TumblingWindow {
  private sizeSeconds: number;
  current: WindowBuffer;

  constructor(sizeSeconds: number) {
    this.sizeSeconds = sizeSeconds;
    const now = new Date();
    this.current = new WindowBuffer(
      now,
      new Date(now.getTime() + sizeSeconds * 1000),
    );
  }

  add(v: number): WindowBuffer | null {
    const now = new Date();
    let completed: WindowBuffer | null = null;

    if (now > this.current.end) {
      completed = this.current;
      const start = this.current.end;
      this.current = new WindowBuffer(
        start,
        new Date(start.getTime() + this.sizeSeconds * 1000),
      );
    }

    this.current.add(v);
    return completed;
  }
}

export class SlidingWindow {
  private sizeSeconds: number;
  private stepSeconds: number;
  private windows: WindowBuffer[] = [];
  private lastStep: Date;

  constructor(sizeSeconds: number, stepSeconds: number) {
    this.sizeSeconds = sizeSeconds;
    this.stepSeconds = stepSeconds;
    const now = new Date();
    this.windows.push(
      new WindowBuffer(now, new Date(now.getTime() + sizeSeconds * 1000)),
    );
    this.lastStep = now;
  }

  add(v: number): WindowBuffer[] {
    const now = new Date();
    const completed: WindowBuffer[] = [];

    if (
      now.getTime() - this.lastStep.getTime() >=
      this.stepSeconds * 1000
    ) {
      this.windows.push(
        new WindowBuffer(
          now,
          new Date(now.getTime() + this.sizeSeconds * 1000),
        ),
      );
      this.lastStep = now;
    }

    const live: WindowBuffer[] = [];
    for (const win of this.windows) {
      win.add(v);
      if (now > win.end) {
        completed.push(win);
      } else {
        live.push(win);
      }
    }
    this.windows = live;

    return completed;
  }
}
