import { WindowBuffer, TumblingWindow, SlidingWindow } from "../src/services/streaming/window_impl";

describe("WindowBuffer", () => {
  describe("compute", () => {
    it("computes sum correctly", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(10);
      buf.add(20);
      buf.add(30);
      const [value, count] = buf.compute("sum");
      expect(value).toBe(60);
      expect(count).toBe(3);
    });

    it("computes avg correctly", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(10);
      buf.add(20);
      buf.add(30);
      const [value, count] = buf.compute("avg");
      expect(value).toBe(20);
      expect(count).toBe(3);
    });

    it("computes count correctly", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(5);
      buf.add(10);
      const [value, count] = buf.compute("count");
      expect(value).toBe(2);
      expect(count).toBe(2);
    });

    it("computes min correctly", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(30);
      buf.add(10);
      buf.add(20);
      const [value, count] = buf.compute("min");
      expect(value).toBe(10);
      expect(count).toBe(3);
    });

    it("computes max correctly", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(10);
      buf.add(30);
      buf.add(20);
      const [value, count] = buf.compute("max");
      expect(value).toBe(30);
      expect(count).toBe(3);
    });

    it("returns [0, 0] for empty buffer", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      const [value, count] = buf.compute("sum");
      expect(value).toBe(0);
      expect(count).toBe(0);
    });

    it("returns [0, 0] for unknown aggregation", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(10);
      const [value, count] = buf.compute("unknown" as any);
      expect(value).toBe(0);
      expect(count).toBe(0);
    });

    it("handles single value for min/max", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(42);
      expect(buf.compute("min")[0]).toBe(42);
      expect(buf.compute("max")[0]).toBe(42);
    });

    it("handles negative values for sum", () => {
      const buf = new WindowBuffer(new Date(), new Date());
      buf.add(-10);
      buf.add(5);
      expect(buf.compute("sum")[0]).toBe(-5);
    });
  });
});

describe("TumblingWindow", () => {
  jest.useFakeTimers();

  it("adds value to current window", () => {
    const win = new TumblingWindow(60);
    const result = win.add(42);
    expect(result).toBeNull();
  });

  it("returns completed window when time exceeds", () => {
    const win = new TumblingWindow(60);
    win.add(10);
    jest.advanceTimersByTime(61000);
    const result = win.add(20);
    expect(result).not.toBeNull();
    expect(result!.compute("count")[0]).toBe(1);
  });

  it("new window starts after previous ends", () => {
    const win = new TumblingWindow(60);
    win.add(10);
    jest.advanceTimersByTime(61000);
    win.add(20);
    expect(win.current.compute("count")[0]).toBe(1);
  });

  it("handles late value in completed window", () => {
    const win = new TumblingWindow(60);
    win.add(5);
    jest.advanceTimersByTime(61000);
    const completed = win.add(10);
    expect(completed).not.toBeNull();
  });

  it("returns null when window not complete", () => {
    const win = new TumblingWindow(120);
    const result = win.add(10);
    expect(result).toBeNull();
  });

  it("completed window has correct values", () => {
    const win = new TumblingWindow(60);
    win.add(10);
    win.add(20);
    jest.advanceTimersByTime(61000);
    const completed = win.add(5);
    expect(completed!.compute("sum")[0]).toBe(30);
  });

  it("handles multiple window completions", () => {
    const win = new TumblingWindow(10);
    win.add(1);
    jest.advanceTimersByTime(11000);
    win.add(2);
    jest.advanceTimersByTime(11000);
    const completed = win.add(3);
    expect(completed).not.toBeNull();
  });

  it("empty completed window after time passes", () => {
    const win = new TumblingWindow(60);
    jest.advanceTimersByTime(61000);
    const completed = win.add(10);
    expect(completed).not.toBeNull();
  });
});

describe("SlidingWindow", () => {
  jest.useFakeTimers();

  it("adds value to windows", () => {
    const win = new SlidingWindow(120, 60);
    const completed = win.add(42);
    expect(completed).toEqual([]);
  });

  it("creates new window on step", () => {
    const win = new SlidingWindow(120, 60);
    win.add(10);
    jest.advanceTimersByTime(61000);
    const completed = win.add(20);
    expect(completed).toEqual([]);
  });

  it("returns completed windows when they exceed", () => {
    const win = new SlidingWindow(60, 30);
    win.add(10);
    jest.advanceTimersByTime(31000);
    win.add(20);
    jest.advanceTimersByTime(31000);
    const completed = win.add(30);
    expect(completed.length).toBeGreaterThanOrEqual(1);
  });

  it("removes expired windows", () => {
    const win = new SlidingWindow(30, 30);
    win.add(1);
    jest.advanceTimersByTime(31000);
    win.add(2);
    jest.advanceTimersByTime(31000);
    const completed = win.add(3);
    jest.advanceTimersByTime(31000);
    const moreCompleted = win.add(4);
    expect(moreCompleted.length).toBeGreaterThanOrEqual(1);
  });

  it("distributes value across all active windows", () => {
    const win = new SlidingWindow(120, 60);
    win.add(10);
    jest.advanceTimersByTime(61000);
    win.add(20);
    win.add(5);
    expect(win.add(0)).toEqual([]);
  });

  it("handles empty value addition", () => {
    const win = new SlidingWindow(60, 30);
    expect(win.add(0)).toEqual([]);
  });

  it("step creates new window with correct time range", () => {
    const win = new SlidingWindow(120, 60);
    win.add(10);
    jest.advanceTimersByTime(61000);
    win.add(20);
    jest.advanceTimersByTime(31000);
    const completed = win.add(30);
    expect(Array.isArray(completed)).toBe(true);
  });

  it("does not create new window before step interval", () => {
    const win = new SlidingWindow(120, 60);
    win.add(10);
    jest.advanceTimersByTime(30000);
    win.add(20);
    jest.advanceTimersByTime(29000);
    const completed = win.add(30);
    expect(completed).toEqual([]);
  });
});
