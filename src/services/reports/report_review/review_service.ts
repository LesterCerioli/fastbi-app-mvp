import { query } from "../../db";
import { ReportRunStateMachineService } from "../report_run/state_machine";
import { ReportNarrativeService } from "../report_narrative/narrative_service";

export interface RejectReviewRequest {
  reviewerEmail: string;
  comments: string;
}

export interface ApproveReviewRequest {
  reviewerEmail: string;
  comments?: string;
}

export interface OverrideSectionRequest {
  overrideByEmail: string;
  overrideText: string;
  overrideReason?: string;
}

export interface ReviewDetailsResponse {
  runID: string;
  runStatus: string;
  sections: any[];
  review: any;
  overrides: any[];
}

export interface ReportReviewDTO {
  id: string;
  runID: string;
  organizationID: string;
  reviewerID: string;
  status: string;
  reviewedAt: Date;
  comments: string | null;
  createdAt: Date;
}

export interface SectionOverrideDTO {
  id: string;
  runID: string;
  organizationID: string;
  sectionID: string;
  originalText: string;
  overrideText: string;
  overrideBy: string;
  overrideReason: string;
  overriddenAt: Date;
}

export class ErrWrongRunStatus extends Error {
  constructor(
    public runID: string,
    public expected: string,
    public actual: string
  ) {
    super(`run ${runID} must be in "${expected}" state (current: "${actual}")`);
    this.name = "ErrWrongRunStatus";
  }
}

export function isWrongRunStatus(err: Error): boolean {
  return err instanceof ErrWrongRunStatus;
}

export class ReportReviewService {
  constructor(
    private stateMachine: ReportRunStateMachineService,
    private narrativeSvc: ReportNarrativeService
  ) {}

  async resolveRunID(createdAt: Date, organizationName: string): Promise<string> {
    return this.stateMachine.resolveRunIDByCreatedAt(createdAt, organizationName);
  }

  async resolveUserID(email: string, organizationName: string): Promise<string> {
    if (!email) throw new Error("email is required");
    const orgID = await this.stateMachine.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id FROM public.users WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [email, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error(`user not found: ${email}`);
    }
    return result.rows[0].id;
  }

  rejectReviewValidation(req: RejectReviewRequest): boolean {
    if (!req.reviewerEmail) throw new Error("reviewer_email is required");
    if (!req.comments) throw new Error("comments are required when rejecting a review");
    return true;
  }

  async getReviewDetails(
    runID: string,
    organizationName: string
  ): Promise<ReviewDetailsResponse> {
    const run = await this.stateMachine.getRun(runID, organizationName);
    if (run.status !== "review_pending") {
      throw new Error(
        `run ${runID} is not in REVIEW_PENDING state (current: ${run.status})`
      );
    }

    const sectionsResp = await this.narrativeSvc.getNarrativeSections(
      runID,
      organizationName
    );

    let review: any = null;
    try {
      review = await this.getLatestReview(runID);
    } catch (err: any) {
      console.warn(`[ReportReview] warn: could not load review record for run ${runID}:`, err.message);
    }

    let overrides: any[] = [];
    try {
      overrides = await this.listOverrides(runID);
    } catch (err: any) {
      console.warn(`[ReportReview] warn: could not load overrides for run ${runID}:`, err.message);
    }

    return {
      runID: run.id,
      runStatus: run.status,
      sections: sectionsResp.sections,
      review,
      overrides,
    };
  }

  async approveReview(
    runID: string,
    req: ApproveReviewRequest,
    organizationName: string
  ): Promise<ReportReviewDTO> {
    if (!req.reviewerEmail) throw new Error("reviewer_email is required");

    const reviewerID = await this.resolveUserID(req.reviewerEmail, organizationName);

    const run = await this.stateMachine.getRun(runID, organizationName);
    if (run.status !== "review_pending") {
      throw new ErrWrongRunStatus(runID, "review_pending", run.status);
    }

    const reviewDTO = await this.upsertReview(
      runID, run.organizationID, reviewerID, "approved", req.comments || ""
    );

    await this.stateMachine.transition(runID, organizationName, {
      toStatus: "approved",
      metadata: { reviewer_email: req.reviewerEmail, action: "approved" },
    });

    await this.stateMachine.transition(runID, organizationName, {
      toStatus: "formatting",
      metadata: { reviewer_email: req.reviewerEmail, action: "approved" },
    });

    return reviewDTO;
  }

  async rejectReview(
    runID: string,
    req: RejectReviewRequest,
    organizationName: string
  ): Promise<ReportReviewDTO> {
    if (!req.reviewerEmail) throw new Error("reviewer_email is required");
    if (!req.comments) throw new Error("comments are required when rejecting a review");

    const reviewerID = await this.resolveUserID(req.reviewerEmail, organizationName);

    const run = await this.stateMachine.getRun(runID, organizationName);
    if (run.status !== "review_pending") {
      throw new ErrWrongRunStatus(runID, "review_pending", run.status);
    }

    const reviewDTO = await this.upsertReview(
      runID, run.organizationID, reviewerID, "rejected", req.comments
    );

    await this.stateMachine.transition(runID, organizationName, {
      toStatus: "generating",
      metadata: {
        reviewer_email: req.reviewerEmail,
        action: "rejected",
        rejection_comments: req.comments,
        regeneration_hint: req.comments,
      },
    });

    return reviewDTO;
  }

  async overrideSection(
    runID: string,
    sectionID: string,
    req: OverrideSectionRequest
  ): Promise<SectionOverrideDTO> {
    if (!req.overrideByEmail) throw new Error("override_by_email is required");
    if (!sectionID) throw new Error("section_id is required");
    if (!req.overrideText) throw new Error("override_text is required");

    const orgID = await this.getRunOrganizationID(runID);

    const userResult = await query(
      `SELECT id FROM public.users WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [req.overrideByEmail, orgID]
    );
    if (userResult.rows.length === 0) {
      throw new Error(`user not found: ${req.overrideByEmail}`);
    }
    const overrideByID = userResult.rows[0].id;

    const originalText = await this.getSectionText(runID, sectionID);
    const dto = await this.insertOverride(
      runID, orgID, overrideByID, sectionID, originalText, req
    );

    await this.applySectionOverride(runID, sectionID, req.overrideText);
    await this.markReviewOverridden(runID);

    return dto;
  }

  private async getLatestReview(runID: string): Promise<ReportReviewDTO | null> {
    const result = await query(
      `SELECT id, run_id, organization_id, reviewer_id, status, reviewed_at, comments, created_at
       FROM public.report_reviews
       WHERE run_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [runID]
    );
    if (result.rows.length === 0) return null;
    return this.mapReviewRow(result.rows[0]);
  }

  private async getRunOrganizationID(runID: string): Promise<string> {
    const result = await query(
      `SELECT organization_id FROM public.report_runs WHERE id = $1`,
      [runID]
    );
    if (result.rows.length === 0) {
      throw new Error(`report run ${runID} not found`);
    }
    return result.rows[0].organization_id;
  }

  private async upsertReview(
    runID: string,
    organizationID: string,
    reviewerID: string,
    status: string,
    comments: string
  ): Promise<ReportReviewDTO> {
    const now = new Date();
    const result = await query(
      `INSERT INTO public.report_reviews (run_id, organization_id, reviewer_id, status, reviewed_at, comments)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, run_id, organization_id, reviewer_id, status, reviewed_at, comments, created_at`,
      [runID, organizationID, reviewerID, status, now, comments || null]
    );
    return this.mapReviewRow(result.rows[0]);
  }

  private async markReviewOverridden(runID: string): Promise<void> {
    await query(
      `UPDATE public.report_reviews
       SET status = 'overridden'
       WHERE run_id = $1 AND status = 'pending'`,
      [runID]
    );
  }

  private async listOverrides(runID: string): Promise<SectionOverrideDTO[]> {
    const result = await query(
      `SELECT id, run_id, organization_id, section_id, original_text, override_text,
              override_by, override_reason, overridden_at
       FROM public.report_section_overrides
       WHERE run_id = $1
       ORDER BY overridden_at ASC`,
      [runID]
    );
    return result.rows.map((r: any) => ({
      id: r.id,
      runID: r.run_id,
      organizationID: r.organization_id,
      sectionID: r.section_id,
      originalText: r.original_text,
      overrideText: r.override_text,
      overrideBy: r.override_by,
      overrideReason: r.override_reason || "",
      overriddenAt: r.overridden_at,
    }));
  }

  private async getSectionText(runID: string, sectionID: string): Promise<string> {
    const result = await query(
      `SELECT text FROM public.report_narrative_sections
       WHERE run_id = $1 AND section_id = $2
       LIMIT 1`,
      [runID, sectionID]
    );
    if (result.rows.length === 0) {
      throw new Error(`section "${sectionID}" not found for run ${runID}`);
    }
    return result.rows[0].text;
  }

  private async insertOverride(
    runID: string,
    organizationID: string,
    overrideByID: string,
    sectionID: string,
    originalText: string,
    req: OverrideSectionRequest
  ): Promise<SectionOverrideDTO> {
    const result = await query(
      `INSERT INTO public.report_section_overrides
         (run_id, organization_id, section_id, original_text, override_text, override_by, override_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, run_id, organization_id, section_id, original_text, override_text,
                 override_by, override_reason, overridden_at`,
      [
        runID, organizationID, sectionID, originalText, req.overrideText,
        overrideByID, req.overrideReason || null,
      ]
    );
    const r = result.rows[0];
    return {
      id: r.id,
      runID: r.run_id,
      organizationID: r.organization_id,
      sectionID: r.section_id,
      originalText: r.original_text,
      overrideText: r.override_text,
      overrideBy: r.override_by,
      overrideReason: r.override_reason || "",
      overriddenAt: r.overridden_at,
    };
  }

  private async applySectionOverride(
    runID: string,
    sectionID: string,
    overrideText: string
  ): Promise<void> {
    await query(
      `UPDATE public.report_narrative_sections
       SET text = $1
       WHERE run_id = $2 AND section_id = $3`,
      [overrideText, runID, sectionID]
    );
  }

  private mapReviewRow(r: any): ReportReviewDTO {
    return {
      id: r.id,
      runID: r.run_id,
      organizationID: r.organization_id,
      reviewerID: r.reviewer_id,
      status: r.status,
      reviewedAt: r.reviewed_at,
      comments: r.comments,
      createdAt: r.created_at,
    };
  }
}
