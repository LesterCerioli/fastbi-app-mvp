"use client";

import { type WorkflowDefinition } from "../workflowTypes";
import * as S from "./styles";

const TEMPLATE_2_DEFINITION: WorkflowDefinition = {
  metadata: {
    name: "Financial Close Workflow",
    description: "Month-end and year-end financial close process with journal entry review, reconciliations, adjustments, and financial statement generation.",
    version: 1,
    tags: ["close", "financial", "month-end", "reconciliation"],
  },
  nodes: [
    { id: "t2-start", type: "start", label: "Start", position: { x: 0, y: 200 } },
    { id: "t2-je-review", type: "process", label: "Journal Entry Review", description: "Review and validate journal entries", position: { x: 260, y: 200 } },
    { id: "t2-recon", type: "process", label: "Reconciliation", description: "Reconcile all accounts", position: { x: 520, y: 200 } },
    { id: "t2-adjust", type: "decision", label: "Adjustments Needed?", description: "Check if adjustments are required", position: { x: 780, y: 200 } },
    { id: "t2-make-adjust", type: "process", label: "Make Adjustments", description: "Post adjusting entries", position: { x: 1040, y: 120 } },
    { id: "t2-fin-stmts", type: "process", label: "Financial Statements", description: "Generate P&L, Balance Sheet, Cash Flow", position: { x: 1040, y: 280 } },
    { id: "t2-review", type: "decision", label: "Final Review", description: "Review final statements", position: { x: 1300, y: 200 } },
    { id: "t2-approve", type: "process", label: "Approve Close", description: "Approve and lock period", position: { x: 1560, y: 120 } },
    { id: "t2-revise", type: "process", label: "Revise Statements", description: "Revise based on feedback", position: { x: 1560, y: 280 } },
    { id: "t2-end", type: "end", label: "End", position: { x: 1820, y: 200 } },
  ],
  edges: [
    { id: "t2-e1", source: "t2-start", target: "t2-je-review" },
    { id: "t2-e2", source: "t2-je-review", target: "t2-recon" },
    { id: "t2-e3", source: "t2-recon", target: "t2-adjust" },
    { id: "t2-e4", source: "t2-adjust", target: "t2-make-adjust", label: "Yes" },
    { id: "t2-e5", source: "t2-adjust", target: "t2-fin-stmts", label: "No" },
    { id: "t2-e6", source: "t2-make-adjust", target: "t2-recon", label: "Re-reconcile" },
    { id: "t2-e7", source: "t2-fin-stmts", target: "t2-review" },
    { id: "t2-e8", source: "t2-review", target: "t2-approve", label: "Approved" },
    { id: "t2-e9", source: "t2-review", target: "t2-revise", label: "Revise" },
    { id: "t2-e10", source: "t2-revise", target: "t2-review", label: "Re-review" },
    { id: "t2-e11", source: "t2-approve", target: "t2-end" },
  ],
};

export { TEMPLATE_2_DEFINITION };

export default function WorkflowTemplate2({ onSelect }: { onSelect?: (def: WorkflowDefinition) => void }) {
  return (
    <S.Card onClick={() => onSelect?.(TEMPLATE_2_DEFINITION)}>
      <S.Title>Financial Close Workflow</S.Title>
      <S.Description>
        Journal review → Reconciliation → Adjustments → Statements → Approval → Close
      </S.Description>
      <S.TagList>
        <S.Tag $color="#22c55e">10 steps</S.Tag>
        <S.Tag $color="#a855f7">close</S.Tag>
        <S.Tag $color="#3b82f6">reconciliation</S.Tag>
      </S.TagList>
    </S.Card>
  );
}
