import { query } from "../db";
import { EnhancedTFIDFVectorizer } from "./vectorizer";

export interface SimilarContext {
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

export class RAGEngine {
  private vectorizer: EnhancedTFIDFVectorizer;

  constructor() {
    this.vectorizer = new EnhancedTFIDFVectorizer();
  }

  async findSimilarContext(orgId: string, queryText: string, limit: number): Promise<SimilarContext[]> {
    const queryVector = this.vectorizer.textToVector(queryText);

    const result = await query(
      `SELECT title, description, metadata
       FROM public.agent_insights
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [orgId]
    );

    const contexts: SimilarContext[] = [];

    for (const row of result.rows) {
      const title: string = row.title ?? "";
      const description: string = row.description ?? "";
      const content = title + " " + description;
      const contentVector = this.vectorizer.textToVector(content);
      const similarity = this.vectorizer.cosineSimilarity(queryVector, contentVector);

      if (similarity > 0.3) {
        contexts.push({
          content,
          similarity,
          metadata: { title },
        });
      }
    }

    contexts.sort((a, b) => b.similarity - a.similarity);

    return contexts.slice(0, limit);
  }

  async findSimilarHistoricalIssues(
    orgId: string,
    issueType: string,
    currentMetrics: Record<string, any>
  ): Promise<SimilarContext[]> {
    const queryText = `similar issue: ${issueType} with metrics ${JSON.stringify(currentMetrics)}`;
    return this.findSimilarContext(orgId, queryText, 5);
  }

  async getRelevantKnowledge(orgId: string, situation: Record<string, any>): Promise<string> {
    const parts: string[] = [];

    if (typeof situation["metric"] === "string") {
      parts.push(situation["metric"]);
    }
    if (typeof situation["change_percent"] === "number") {
      const change = situation["change_percent"];
      if (change > 0) {
        parts.push(`growth of ${change} percent`);
      } else {
        parts.push(`decline of ${-change} percent`);
      }
    }
    if (typeof situation["dimension"] === "string") {
      parts.push(situation["dimension"]);
    }

    if (parts.length === 0) return "";

    const queryText = parts.join(" ");
    const contexts = await this.findSimilarContext(orgId, queryText, 3);

    return contexts.map((ctx) => `- ${ctx.content} (similarity: ${ctx.similarity.toFixed(2)})`).join("\n");
  }
}
