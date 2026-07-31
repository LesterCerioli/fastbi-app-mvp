import { jest } from "@jest/globals";

import { BehavioralMemory } from "../src/services/ai/behavioral_memory";
import { AgentRepository } from "../src/services/ai/repository";

const mockRepo = {
  savePattern: jest.fn(),
  findSimilarPatterns: jest.fn(),
} as unknown as jest.Mocked<AgentRepository>;

const memory = new BehavioralMemory(mockRepo);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("BehavioralMemory", () => {
  it("recordPattern saves with computed effectiveness", async () => {
    await memory.recordPattern("org-1", { metric: "revenue", change_percent: 15 }, "alert", 0.9);
    expect(mockRepo.savePattern).toHaveBeenCalledWith(
      "org-1",
      expect.any(String),
      "alert",
      0.9,
      expect.any(Number)
    );
  });

  it("findSimilarPatterns filters effectiveness > 0.3", async () => {
    mockRepo.findSimilarPatterns.mockResolvedValue([
      { id: "1", triggerSignature: "revenue", actionTaken: "alert", outcomeSuccess: 1, effectiveness: 0.5 },
      { id: "2", triggerSignature: "cost", actionTaken: "ignore", outcomeSuccess: 0, effectiveness: 0.1 },
      { id: "3", triggerSignature: "margin", actionTaken: "review", outcomeSuccess: 1, effectiveness: 0.8 },
    ]);
    const result = await memory.findSimilarPatterns("org-1", { metric: "revenue" }, 5);
    expect(result).toHaveLength(2);
    expect(result[0].effectiveness).toBe(0.5);
    expect(result[1].effectiveness).toBe(0.8);
  });

  it("getBestPatternForSituation returns highest effectiveness", async () => {
    mockRepo.findSimilarPatterns.mockResolvedValue([
      { id: "1", triggerSignature: "a", actionTaken: "x", outcomeSuccess: 0, effectiveness: 0.4 },
      { id: "2", triggerSignature: "b", actionTaken: "y", outcomeSuccess: 1, effectiveness: 0.9 },
    ]);
    const result = await memory.getBestPatternForSituation("org-1", { metric: "revenue" });
    expect(result).not.toBeNull();
    expect(result!.effectiveness).toBe(0.9);
  });

  it("getBestPatternForSituation returns null when no patterns found", async () => {
    mockRepo.findSimilarPatterns.mockResolvedValue([]);
    const result = await memory.getBestPatternForSituation("org-1", {});
    expect(result).toBeNull();
  });

  it("recordPattern handles zero outcomeSuccess", async () => {
    await memory.recordPattern("org-1", { metric: "cost" }, "ignore", 0);
    expect(mockRepo.savePattern).toHaveBeenCalled();
  });

  it("findSimilarPatterns returns empty when none pass threshold", async () => {
    mockRepo.findSimilarPatterns.mockResolvedValue([
      { id: "1", triggerSignature: "a", actionTaken: "x", outcomeSuccess: 0, effectiveness: 0.2 },
    ]);
    const result = await memory.findSimilarPatterns("org-1", { metric: "x" }, 5);
    expect(result).toHaveLength(0);
  });

  it("recordPattern caps effectiveness at 1 for outcomeSuccess > 1", async () => {
    await memory.recordPattern("org-1", {}, "action", 1.5);
    expect(mockRepo.savePattern).toHaveBeenCalled();
  });

  it("recordPattern floors effectiveness at 0 for outcomeSuccess < 0", async () => {
    await memory.recordPattern("org-1", {}, "action", -5);
    const call = mockRepo.savePattern.mock.calls[0];
    expect(call[3]).toBe(-5);
    expect(call[4]).toBe(0);
  });
});
