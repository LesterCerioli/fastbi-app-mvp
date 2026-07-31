import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("../src/services/reports/report_run/state_machine");
jest.mock("../src/services/reports/report_narrative/narrative_service");
import { query } from "../src/services/db";
import { ReportRunStateMachineService } from "../src/services/reports/report_run/state_machine";
import { ReportNarrativeService } from "../src/services/reports/report_narrative/narrative_service";
import { ReportReviewService, ErrWrongRunStatus } from "../src/services/reports/report_review/review_service";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockStateMachine = new ReportRunStateMachineService() as jest.Mocked<ReportRunStateMachineService>;
const mockNarrativeSvc = new ReportNarrativeService(null as any, null as any, null as any, null as any) as jest.Mocked<ReportNarrativeService>;
const svc = new ReportReviewService(mockStateMachine, mockNarrativeSvc);

describe("ReportReviewService - positive scenarios", () => {
  it("rejects review validation with valid input", () => {
    expect(svc.rejectReviewValidation({ reviewerEmail: "a@b.com", comments: "needs work" })).toBe(true);
  });

  it("approves a review", async () => {
    mockStateMachine.getRun.mockResolvedValue({ id: "run-1", organizationID: "org-1", status: "review_pending" } as any);
    mockStateMachine.resolveOrganizationID.mockResolvedValue("org-1");
    mockStateMachine.transition.mockResolvedValue({} as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "user-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "rev-1", run_id: "run-1", organization_id: "org-1", reviewer_id: "user-1", status: "approved", reviewed_at: new Date(), comments: "", created_at: new Date() }],
    } as any);
    const dto = await svc.approveReview("run-1", { reviewerEmail: "a@b.com" }, "acme");
    expect(dto.status).toBe("approved");
  });

  it("rejects a review", async () => {
    mockStateMachine.getRun.mockResolvedValue({ id: "run-1", organizationID: "org-1", status: "review_pending" } as any);
    mockStateMachine.resolveOrganizationID.mockResolvedValue("org-1");
    mockStateMachine.transition.mockResolvedValue({} as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "user-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "rev-1", run_id: "run-1", organization_id: "org-1", reviewer_id: "user-1", status: "rejected", reviewed_at: new Date(), comments: "needs work", created_at: new Date() }],
    } as any);
    const dto = await svc.rejectReview("run-1", { reviewerEmail: "a@b.com", comments: "needs work" }, "acme");
    expect(dto.status).toBe("rejected");
  });

  it("returns review details", async () => {
    mockStateMachine.getRun.mockResolvedValue({ id: "run-1", organizationID: "org-1", status: "review_pending" } as any);
    mockNarrativeSvc.getNarrativeSections.mockResolvedValue({ sections: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const details = await svc.getReviewDetails("run-1", "acme");
    expect(details.runID).toBe("run-1");
  });
});

describe("ReportReviewService - negative scenarios", () => {
  it("throws when reviewer_email is missing for approveReview", async () => {
    await expect(svc.approveReview("run-1", { reviewerEmail: "" }, "acme")).rejects.toThrow("reviewer_email is required");
  });

  it("throws when comments are missing for rejectReview", async () => {
    await expect(svc.rejectReview("run-1", { reviewerEmail: "a@b.com", comments: "" }, "acme")).rejects.toThrow("comments are required when rejecting a review");
  });

  it("throws ErrWrongRunStatus when run is not review_pending on approveReview", async () => {
    mockStateMachine.resolveOrganizationID.mockResolvedValue("org-1");
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "user-1" }] } as any);
    mockStateMachine.getRun.mockResolvedValue({ id: "run-1", organizationID: "org-1", status: "generating" } as any);
    await expect(svc.approveReview("run-1", { reviewerEmail: "a@b.com" }, "acme")).rejects.toThrow(ErrWrongRunStatus);
  });

  it("throws when email is missing for resolveUserID", async () => {
    await expect(svc.resolveUserID("", "acme")).rejects.toThrow("email is required");
  });
});
