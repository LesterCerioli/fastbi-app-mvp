import { query } from "../../db";
import { ContextRetriever, RetrievedContext } from "./context_retriever";
import { TextComposer, NarrativeSectionRequest, ComposedSection } from "./text_composer";
import { DataVerifier, VerifiedClaim } from "./data_verifier";
import { CitationBuilder, Claim } from "./citation_builder";

const dataIntegrityThreshold = 0.95;

export interface GenerateNarrativeRequest {
  runID: string;
  organizationName: string;
  sections: NarrativeSectionRequest[];
  topK: number;
  lookbackDays: number;
}

export interface NarrativeSection {
  sectionID: string;
  sectionTitle: string;
  text: string;
  citations: Claim[];
  dataIntegrityScore: number;
  isFlagged: boolean;
  flagReason: string;
}

export interface NarrativeResult {
  runID: string;
  organizationName: string;
  sections: NarrativeSection[];
  overallIntegrityScore: number;
  flaggedCount: number;
  generatedAt: Date;
}

export interface NarrativeSectionsResponse {
  runID: string;
  sections: NarrativeSection[];
  count: number;
}

export class ReportNarrativeService {
  private ctxRetriever = new ContextRetriever();
  private textComposer = new TextComposer();
  private dataVerifier = new DataVerifier();
  private citationBuilder = new CitationBuilder();

  async generate(req: GenerateNarrativeRequest): Promise<NarrativeResult> {
    const orgID = await this.resolveOrganizationID(req.organizationName);

    const topK = req.topK > 0 ? req.topK : 10;
    const lookback = req.lookbackDays > 0 ? req.lookbackDays : 30;

    const sections: NarrativeSection[] = [];
    let flaggedCount = 0;
    let totalScore = 0;

    for (const secReq of req.sections) {
      const retrieved = await this.ctxRetriever.retrieve(
        orgID, secReq.queryHint, secReq.sectionType, topK, lookback
      );

      const composed = this.textComposer.compose(secReq, retrieved);

      const [verified, integrityScore] = this.dataVerifier.verify(
        composed.claims, retrieved.numericData
      );

      const citations = this.citationBuilder.build(verified);

      const isFlagged = integrityScore < dataIntegrityThreshold;
      let flagReason = "";
      if (isFlagged) {
        flagReason = `data integrity score ${integrityScore.toFixed(2)} is below the required threshold of ${dataIntegrityThreshold.toFixed(2)}`;
      }

      const section: NarrativeSection = {
        sectionID: secReq.sectionID,
        sectionTitle: secReq.title,
        text: composed.text,
        citations,
        dataIntegrityScore: integrityScore,
        isFlagged,
        flagReason,
      };

      await this.persistSection(req.runID, orgID, section);

      sections.push(section);
      totalScore += integrityScore;
      if (isFlagged) flaggedCount++;
    }

    const overallScore = sections.length > 0 ? totalScore / sections.length : 0;

    return {
      runID: req.runID,
      organizationName: req.organizationName,
      sections,
      overallIntegrityScore: overallScore,
      flaggedCount,
      generatedAt: new Date(),
    };
  }

  async getNarrativeSections(
    runID: string,
    organizationName: string
  ): Promise<NarrativeSectionsResponse> {
    const orgID = await this.resolveOrganizationID(organizationName);

    const result = await query(
      `SELECT section_id, section_title, text, citations, data_integrity_score, is_flagged, flag_reason
       FROM public.report_narrative_sections
       WHERE run_id = $1 AND organization_id = $2
       ORDER BY created_at ASC`,
      [runID, orgID]
    );

    const sections: NarrativeSection[] = result.rows.map((r: any) => ({
      sectionID: r.section_id,
      sectionTitle: r.section_title,
      text: r.text,
      citations: typeof r.citations === "string" ? JSON.parse(r.citations) : r.citations || [],
      dataIntegrityScore: parseFloat(r.data_integrity_score),
      isFlagged: r.is_flagged,
      flagReason: r.flag_reason || "",
    }));

    return { runID, sections, count: sections.length };
  }

  async resolveRunIDByCreatedAt(
    createdAt: Date,
    organizationName: string
  ): Promise<string> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id FROM public.report_runs
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at < ($2::timestamptz + INTERVAL '1 second')
       ORDER BY created_at ASC`,
      [orgID, createdAt]
    );

    if (result.rows.length === 0) {
      throw new Error("report run not found for the given created_at");
    }
    if (result.rows.length > 1) {
      throw new Error("ambiguous: multiple runs created within the same second; use a more precise timestamp");
    }
    return result.rows[0].id;
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization_name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  async persistSection(
    runID: string,
    orgID: string,
    sec: NarrativeSection
  ): Promise<void> {
    const citationsJSON = JSON.stringify(sec.citations);
    const flagReason = sec.flagReason || null;

    await query(
      `INSERT INTO public.report_narrative_sections
         (run_id, organization_id, section_id, section_title, text, citations, data_integrity_score, is_flagged, flag_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (run_id, section_id) DO UPDATE SET
         section_title        = EXCLUDED.section_title,
         text                 = EXCLUDED.text,
         citations            = EXCLUDED.citations,
         data_integrity_score = EXCLUDED.data_integrity_score,
         is_flagged           = EXCLUDED.is_flagged,
         flag_reason          = EXCLUDED.flag_reason`,
      [
        runID, orgID, sec.sectionID, sec.sectionTitle, sec.text,
        citationsJSON, sec.dataIntegrityScore, sec.isFlagged, flagReason,
      ]
    );
  }
}
