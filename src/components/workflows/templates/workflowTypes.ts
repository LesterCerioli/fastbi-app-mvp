export interface WorkflowNode {
  id: string;
  type: "start" | "process" | "decision" | "condition" | "end";
  label: string;
  description?: string;
  config?: Record<string, unknown>;
  position: { x: number; y: number };
}

export type EdgeStyle = "solid" | "dashed" | "dotted" | "animated" | "curved" | "stepped";

export const EDGE_STYLES: EdgeStyle[] = ["solid", "dashed", "dotted", "animated", "curved", "stepped"];

export const EDGE_COLORS: { label: string; value: string }[] = [
  { label: "Default", value: "#475569" },
  { label: "Slate", value: "#64748b" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#a855f7" },
  { label: "Cyan", value: "#06b6d4" },
];

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  style?: EdgeStyle;
  color?: string;
}

export interface WorkflowMeta {
  name: string;
  description?: string;
  version?: number;
  tags?: string[];
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: WorkflowMeta;
}

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 100;
export const NODE_GAP_X = 260;
export const NODE_GAP_Y = 140;

export const typeLabels: Record<WorkflowNode["type"], string> = {
  start: "Start",
  process: "Process",
  decision: "Decision",
  condition: "Condition",
  end: "End",
};

export const NODE_COLORS: Record<WorkflowNode["type"], string> = {
  start: "#22c55e",
  process: "#3b82f6",
  decision: "#f97316",
  condition: "#a855f7",
  end: "#ef4444",
};
