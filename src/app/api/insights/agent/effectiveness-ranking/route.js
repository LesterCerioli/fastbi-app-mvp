import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { AgentIntelligenceAggregatorService } from "@/services/ai/agent_intelligence_aggregator_service";

const service = new AgentIntelligenceAggregatorService();

export async function GET(request) {
  try {
    await authenticate(request);

    const result = await service.getInsightEffectivenessRanking();

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
