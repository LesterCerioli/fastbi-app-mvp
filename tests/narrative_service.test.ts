import { jest } from "@jest/globals";
jest.mock("../../../src/services/db", () => ({
  query: jest.fn(),
}));

jest.mock("../../../src/services/reports/report_narrative/context_retriever", () => ({
  ContextRetriever: jest.fn().mockImplementation(() => ({
    retrieve: jest.fn(),
  })),
}));

jest.mock("../../../src/services/reports/report_narrative/text_composer", () => ({
  TextComposer: jest.fn().mockImplementation(() => ({
    compose: jest.fn(),
  })),
}));

jest.mock("../../../src/services/reports/report_narrative/data_verifier", () => ({
  DataVerifier: jest.fn().mockImplementation(() => ({
    verify: jest.fn(),
  })),
}));

jest.mock("../../../src/services/reports/report_narrative/citation_builder", () => ({
  CitationBuilder: jest.fn().mockImplementation(() => ({
    build: jest.fn(),
  })),
}));

import { ReportNarrativeService, type GenerateNarrativeRequest, type NarrativeSectionRequest } from "../../../src/services/reports/report_narrative/narrative_service";
import { query } from "../../../src/services/db";
import { ContextRetriever } from "../../../src/services/reports/report_narrative/context_retriever";
import { TextComposer } from "../../../src/services/reports/report_narrative/text_composer";
import { DataVerifier } from "../../../src/services/reports/report_narrative/data_verifier";
import { CitationBuilder } from "../../../src/services/reports/report_narrative/citation_builder";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("ReportNarrativeService", () => {
  let service: ReportNarrativeService;

  const sectionReq: NarrativeSectionRequest = {
    sectionID: "sec-1",
    title: "Revenue Overview",
    sectionType: "revenue",
    queryHint: "revenue performance",
  };

  const generateReq: GenerateNarrativeRequest = {
    runID: "run-1",
    organizationName: "TestOrg",
    sections: [sectionReq],
    topK: 5,
    lookbackDays: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportNarrativeService();
  });

  describe("generate", () => {
    it("returns full NarrativeResult for valid request", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const mockRetrieved = { kbDocuments: [], numericData: { "sales_records:total_revenue": 100000 }, period: "last_30_days" };
      const mockComposed = { text: "Revenue text with 100000", claims: [{ text: "100000", value: 100000, sourceRef: "sales_records:total_revenue" }] };
      const mockVerified = [{ text: "100000", value: 100000, sourceRef: "sales_records:total_revenue", verified: true, confidence: 1.0 }];
      const mockCitations = [{ text: "100000", sourceRef: "sales_records:total_revenue", value: 100000, verified: true, confidence: 1.0 }];

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockResolvedValue(mockRetrieved);
      const textComposer = (TextComposer as jest.Mock).mock.instances[0];
      textComposer.compose.mockReturnValue(mockComposed);
      const dataVerifier = (DataVerifier as jest.Mock).mock.instances[0];
      dataVerifier.verify.mockReturnValue([mockVerified, 1.0]);
      const citationBuilder = (CitationBuilder as jest.Mock).mock.instances[0];
      citationBuilder.build.mockReturnValue(mockCitations);

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.generate(generateReq);

      expect(result.runID).toBe("run-1");
      expect(result.sections).toHaveLength(1);
      expect(result.overallIntegrityScore).toBe(1.0);
      expect(result.flaggedCount).toBe(0);
    });

    it("flags sections with integrity score below threshold", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const mockRetrieved = { kbDocuments: [], numericData: {}, period: "last_30_days" };
      const mockComposed = { text: "Some text", claims: [] };
      const mockVerified: any[] = [];

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockResolvedValue(mockRetrieved);
      const textComposer = (TextComposer as jest.Mock).mock.instances[0];
      textComposer.compose.mockReturnValue(mockComposed);
      const dataVerifier = (DataVerifier as jest.Mock).mock.instances[0];
      dataVerifier.verify.mockReturnValue([mockVerified, 0.5]);
      const citationBuilder = (CitationBuilder as jest.Mock).mock.instances[0];
      citationBuilder.build.mockReturnValue([]);

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.generate(generateReq);

      expect(result.sections[0].isFlagged).toBe(true);
      expect(result.flaggedCount).toBe(1);
    });

    it("uses defaults for topK and lookbackDays when not provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockResolvedValue({ kbDocuments: [], numericData: {}, period: "" });
      const textComposer = (TextComposer as jest.Mock).mock.instances[0];
      textComposer.compose.mockReturnValue({ text: "", claims: [] });
      const dataVerifier = (DataVerifier as jest.Mock).mock.instances[0];
      dataVerifier.verify.mockReturnValue([[], 1.0]);
      const citationBuilder = (CitationBuilder as jest.Mock).mock.instances[0];
      citationBuilder.build.mockReturnValue([]);

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.generate({ ...generateReq, topK: 0, lookbackDays: 0 });

      expect(ctxRetriever.retrieve).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(String), 10, 30);
    });

    it("processes multiple sections and averages integrity score", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const req: GenerateNarrativeRequest = {
        runID: "run-multi",
        organizationName: "TestOrg",
        sections: [
          { ...sectionReq, sectionID: "sec-1" },
          { ...sectionReq, sectionID: "sec-2" },
        ],
        topK: 5,
        lookbackDays: 30,
      };

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockResolvedValue({ kbDocuments: [], numericData: {}, period: "last_30_days" });
      const textComposer = (TextComposer as jest.Mock).mock.instances[0];
      textComposer.compose.mockReturnValue({ text: "Text", claims: [] });
      const dataVerifier = (DataVerifier as jest.Mock).mock.instances[0];
      dataVerifier.verify
        .mockReturnValueOnce([[], 1.0])
        .mockReturnValueOnce([[], 0.8]);
      const citationBuilder = (CitationBuilder as jest.Mock).mock.instances[0];
      citationBuilder.build.mockReturnValue([]);

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.generate(req);

      expect(result.sections).toHaveLength(2);
      expect(result.overallIntegrityScore).toBe(0.9);
      expect(result.flaggedCount).toBe(1);
    });

    it("persists each section after generation", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockResolvedValue({ kbDocuments: [], numericData: {}, period: "" });
      const textComposer = (TextComposer as jest.Mock).mock.instances[0];
      textComposer.compose.mockReturnValue({ text: "Text", claims: [] });
      const dataVerifier = (DataVerifier as jest.Mock).mock.instances[0];
      dataVerifier.verify.mockReturnValue([[], 1.0]);
      const citationBuilder = (CitationBuilder as jest.Mock).mock.instances[0];
      citationBuilder.build.mockReturnValue([]);

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.generate(generateReq);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO public.report_narrative_sections"), expect.any(Array));
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.generate(generateReq)).rejects.toThrow("organization not found");
    });

    it("handles empty sections array", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const result = await service.generate({ ...generateReq, sections: [] });

      expect(result.sections).toHaveLength(0);
      expect(result.overallIntegrityScore).toBe(0);
    });

    it("handles retrieve errors gracefully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockRejectedValueOnce(new Error("retrieve failed"));

      await expect(service.generate(generateReq)).rejects.toThrow("retrieve failed");
    });

    it("handles persist errors without failing overall generation", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockRejectedValueOnce(new Error("persist failed"));

      const ctxRetriever = (ContextRetriever as jest.Mock).mock.instances[0];
      ctxRetriever.retrieve.mockResolvedValue({ kbDocuments: [], numericData: {}, period: "" });
      const textComposer = (TextComposer as jest.Mock).mock.instances[0];
      textComposer.compose.mockReturnValue({ text: "Text", claims: [] });
      const dataVerifier = (DataVerifier as jest.Mock).mock.instances[0];
      dataVerifier.verify.mockReturnValue([[], 1.0]);
      const citationBuilder = (CitationBuilder as jest.Mock).mock.instances[0];
      citationBuilder.build.mockReturnValue([]);

      await expect(service.generate(generateReq)).rejects.toThrow("persist failed");
    });
  });

  describe("getNarrativeSections", () => {
    it("returns sections for given runID and organization", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            section_id: "sec-1",
            section_title: "Revenue",
            text: "Revenue text",
            citations: "[]",
            data_integrity_score: "0.95",
            is_flagged: false,
            flag_reason: null,
          }],
        } as any);

      const result = await service.getNarrativeSections("run-1", "TestOrg");

      expect(result.sections).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it("returns empty sections when no data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getNarrativeSections("run-1", "TestOrg");

      expect(result.sections).toHaveLength(0);
    });

    it("parses citations JSON string", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            section_id: "sec-1",
            section_title: "Title",
            text: "Text",
            citations: '[{"text":"100","sourceRef":"ref"}]',
            data_integrity_score: "1.0",
            is_flagged: false,
            flag_reason: null,
          }],
        } as any);

      const result = await service.getNarrativeSections("run-1", "TestOrg");

      expect(result.sections[0].citations).toHaveLength(1);
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.getNarrativeSections("run-1", "Unknown")).rejects.toThrow("organization not found");
    });

    it("propagates database errors", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockRejectedValueOnce(new Error("db error"));

      await expect(service.getNarrativeSections("run-1", "TestOrg")).rejects.toThrow("db error");
    });

    it("handles null flag_reason gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            section_id: "sec-1", section_title: "T", text: "T", citations: "[]", data_integrity_score: "1.0", is_flagged: false, flag_reason: null,
          }],
        } as any);

      const result = await service.getNarrativeSections("run-1", "TestOrg");

      expect(result.sections[0].flagReason).toBe("");
    });
  });

  describe("resolveRunIDByCreatedAt", () => {
    it("returns run ID when exactly one match", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "run-1" }] } as any);

      const result = await service.resolveRunIDByCreatedAt(new Date("2024-01-01"), "TestOrg");

      expect(result).toBe("run-1");
    });

    it("throws when no runs found", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.resolveRunIDByCreatedAt(new Date("2024-01-01"), "TestOrg")).rejects.toThrow("report run not found");
    });

    it("throws when multiple runs found in same second", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "run-1" }, { id: "run-2" }] } as any);

      await expect(service.resolveRunIDByCreatedAt(new Date("2024-01-01"), "TestOrg")).rejects.toThrow("ambiguous");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.resolveRunIDByCreatedAt(new Date(), "Unknown")).rejects.toThrow("organization not found");
    });

    it("propagates database errors", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockRejectedValueOnce(new Error("db error"));

      await expect(service.resolveRunIDByCreatedAt(new Date(), "TestOrg")).rejects.toThrow("db error");
    });
  });

  describe("resolveOrganizationID", () => {
    it("returns org ID when found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const result = await service.resolveOrganizationID("TestOrg");

      expect(result).toBe("org-1");
    });

    it("throws when name is empty", async () => {
      await expect(service.resolveOrganizationID("")).rejects.toThrow("organization_name is required");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.resolveOrganizationID("Unknown")).rejects.toThrow("organization not found");
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.resolveOrganizationID("TestOrg")).rejects.toThrow("db error");
    });
  });

  describe("persistSection", () => {
    it("inserts section with ON CONFLICT upsert", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const sec = {
        sectionID: "sec-1",
        sectionTitle: "Test",
        text: "Test text",
        citations: [],
        dataIntegrityScore: 0.95,
        isFlagged: false,
        flagReason: "",
      };

      await service.persistSection("run-1", "org-1", sec);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT"),
        expect.arrayContaining(["run-1", "org-1", "sec-1"])
      );
    });

    it("handles database error on persist", async () => {
      mockQuery.mockRejectedValueOnce(new Error("persist error"));

      await expect(service.persistSection("run-1", "org-1", {
        sectionID: "s1", sectionTitle: "T", text: "T", citations: [], dataIntegrityScore: 1.0, isFlagged: false, flagReason: "",
      })).rejects.toThrow("persist error");
    });

    it("serializes citations as JSON", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const citations = [{ text: "100", sourceRef: "ref", value: 100, verified: true, confidence: 1.0 }];
      await service.persistSection("run-1", "org-1", {
        sectionID: "s1", sectionTitle: "T", text: "T", citations, dataIntegrityScore: 1.0, isFlagged: false, flagReason: "",
      });

      const params = mockQuery.mock.calls[0][1] as any[];
      expect(() => JSON.parse(params[5])).not.toThrow();
    });
  });
});
