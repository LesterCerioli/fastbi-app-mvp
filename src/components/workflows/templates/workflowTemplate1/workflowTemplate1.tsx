"use client";

import { type WorkflowDefinition } from "../workflowTypes";
import * as S from "./styles";

const TEMPLATE_1_DEFINITION: WorkflowDefinition = {
  metadata: {
    name: "Tax Compliance Workflow",
    description: "Complete tax compliance workflow covering document collection, calculation, review, approval, and filing with regulatory validation.",
    version: 1,
    tags: ["tax", "compliance", "filing", "regulatory"],
  },
  nodes: [
    { id: "t1-start", type: "start", label: "Start", position: { x: 0, y: 200 } },
    { id: "t1-doc-collect", type: "process", label: "Document Collection", description: "Gather financial documents and tax records", position: { x: 260, y: 200 } },
    { id: "t1-tax-calc", type: "process", label: "Tax Calculation", description: "Calculate tax liabilities based on collected documents", position: { x: 520, y: 200 } },
    { id: "t1-compliance", type: "decision", label: "Compliance Review", description: "Review for regulatory compliance", position: { x: 780, y: 200 } },
    { id: "t1-approve", type: "process", label: "Approval", description: "Manager approval of tax filings", position: { x: 1040, y: 120 } },
    { id: "t1-rework", type: "process", label: "Rework", description: "Fix compliance issues", position: { x: 1040, y: 280 } },
    { id: "t1-file", type: "process", label: "Filing", description: "Submit tax filings to regulatory body", position: { x: 1300, y: 200 } },
    { id: "t1-end", type: "end", label: "End", position: { x: 1560, y: 200 } },
  ],
  edges: [
    { id: "t1-e1", source: "t1-start", target: "t1-doc-collect" },
    { id: "t1-e2", source: "t1-doc-collect", target: "t1-tax-calc" },
    { id: "t1-e3", source: "t1-tax-calc", target: "t1-compliance" },
    { id: "t1-e4", source: "t1-compliance", target: "t1-approve", label: "Compliant" },
    { id: "t1-e5", source: "t1-compliance", target: "t1-rework", label: "Non-compliant" },
    { id: "t1-e6", source: "t1-approve", target: "t1-file" },
    { id: "t1-e7", source: "t1-rework", target: "t1-tax-calc", label: "Recalculate" },
    { id: "t1-e8", source: "t1-file", target: "t1-end" },
  ],
};

export { TEMPLATE_1_DEFINITION };

export default function WorkflowTemplate1({ onSelect }: { onSelect?: (def: WorkflowDefinition) => void }) {
  return (
    <S.Card onClick={() => onSelect?.(TEMPLATE_1_DEFINITION)}>
      <S.Title>Tax Compliance Workflow</S.Title>
      <S.Description>
        Document collection → Tax calculation → Compliance review → Approval → Filing
      </S.Description>
      <S.TagList>
        <S.Tag $color="#22c55e">8 steps</S.Tag>
        <S.Tag $color="#3b82f6">tax</S.Tag>
        <S.Tag $color="#f97316">compliance</S.Tag>
      </S.TagList>
    </S.Card>
  );
}
