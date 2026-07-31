import { jest } from "@jest/globals";

jest.mock("uuid", () => ({ v4: () => "mock-uuid" }));

import { EventBusImpl } from "../src/services/streaming/event_bus_impl";
import { PipelineServiceImpl, type PipelineDefinition } from "../src/services/streaming/pipeline_impl";

describe("PipelineServiceImpl", () => {
  let service: PipelineServiceImpl;
  let eventBus: EventBusImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    eventBus = new EventBusImpl();
    service = new PipelineServiceImpl(eventBus);
  });

  it("createPipeline adds a tumbling pipeline and returns definition with generated uuid", () => {
    const def: PipelineDefinition = {
      id: "",
      name: "test",
      sourceTopic: "metrics",
      field: "value",
      aggregation: "avg",
      window: { type: "tumbling", sizeSeconds: 60 },
    };

    service.createPipeline(def);

    expect(def.id).toBe("mock-uuid");
    const pipelines = service.listPipelines();
    expect(pipelines).toHaveLength(1);
    expect(pipelines[0].name).toBe("test");
  });

  it("createPipeline adds a sliding pipeline with default step when stepSeconds is 0", () => {
    const def: PipelineDefinition = {
      id: "p1",
      name: "sliding-test",
      sourceTopic: "metrics",
      field: "value",
      aggregation: "sum",
      window: { type: "sliding", sizeSeconds: 60, stepSeconds: 0 },
    };

    service.createPipeline(def);
    expect(def.window.stepSeconds).toBe(30);
  });

  it("stopPipeline removes a running pipeline", () => {
    const def: PipelineDefinition = {
      id: "p1",
      name: "test",
      sourceTopic: "metrics",
      field: "value",
      aggregation: "avg",
      window: { type: "tumbling", sizeSeconds: 60 },
    };
    service.createPipeline(def);

    service.stopPipeline("p1");
    expect(service.listPipelines()).toHaveLength(0);
  });

  it("getLatestResult returns null when no result computed", () => {
    const def: PipelineDefinition = {
      id: "p1",
      name: "test",
      sourceTopic: "metrics",
      field: "value",
      aggregation: "avg",
      window: { type: "tumbling", sizeSeconds: 60 },
    };
    service.createPipeline(def);

    const result = service.getLatestResult("p1");
    expect(result).toBeNull();
  });

  it("createPipeline throws when pipeline id already exists", () => {
    const def: PipelineDefinition = {
      id: "p1",
      name: "test",
      sourceTopic: "metrics",
      field: "value",
      aggregation: "avg",
      window: { type: "tumbling", sizeSeconds: 60 },
    };
    service.createPipeline(def);

    expect(() => service.createPipeline({ ...def })).toThrow("pipeline p1 already exists");
  });

  it("createPipeline throws when window sizeSeconds <= 0", () => {
    const def: PipelineDefinition = {
      id: "p2",
      name: "bad",
      sourceTopic: "metrics",
      field: "value",
      aggregation: "avg",
      window: { type: "tumbling", sizeSeconds: 0 },
    };

    expect(() => service.createPipeline(def)).toThrow("window.size_seconds must be > 0");
  });

  it("stopPipeline throws when pipeline not found", () => {
    expect(() => service.stopPipeline("nonexistent")).toThrow("pipeline nonexistent not found");
  });

  it("getLatestResult throws when pipeline not found", () => {
    expect(() => service.getLatestResult("nonexistent")).toThrow("pipeline nonexistent not found");
  });
});
