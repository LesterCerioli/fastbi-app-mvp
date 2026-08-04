"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  type WorkflowNode,
  type WorkflowEdge,
  type EdgeStyle,
  type WorkflowDefinition,
  EDGE_STYLES,
  EDGE_COLORS,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_GAP_X,
  NODE_GAP_Y,
  NODE_COLORS,
} from "../workflowTypes";
import WorkflowNodeCard from "../workflowNode/workflowNode";
import * as S from "./styles";

let nextNodeId = 1;
function genNodeId() {
  return `node-${nextNodeId++}`;
}
let nextEdgeId = 1;
function genEdgeId() {
  return `edge-${nextEdgeId++}`;
}

interface Props {
  definition: WorkflowDefinition;
  onChange: (def: WorkflowDefinition) => void;
  readOnly?: boolean;
}

function autoLayout(nodes: WorkflowNode[]): WorkflowNode[] {
  const rows: { y: number; nodes: WorkflowNode[] }[] = [];
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);

  for (const node of sorted) {
    const row = rows.find((r) => Math.abs(r.y - node.position.y) < NODE_GAP_Y / 2);
    if (row) {
      row.nodes.push(node);
    } else {
      rows.push({ y: node.position.y, nodes: [node] });
    }
  }

  return nodes.map((node) => {
    const row = rows.find((r) => r.nodes.includes(node));
    if (!row) return node;
    const idx = row.nodes.indexOf(node);
    return {
      ...node,
      position: {
        x: idx * NODE_GAP_X,
        y: row.y,
      },
    };
  });
}

const NODE_TYPES: WorkflowNode["type"][] = ["start", "process", "decision", "condition", "end"];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function edgeGeometry(
  style: EdgeStyle,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { path: string | null; midX: number; midY: number } {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  if (style === "curved") {
    return { path: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`, midX, midY };
  }
  if (style === "stepped") {
    return { path: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`, midX, midY };
  }
  return { path: null, midX, midY };
}

function edgeDashArray(style: EdgeStyle): string {
  if (style === "dashed") return "6,3";
  if (style === "dotted") return "2,6";
  if (style === "animated") return "10,8";
  return "none";
}

function EdgePreview({ style, color }: { style: EdgeStyle; color: string }) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const markerId = `preview-arrow-${color.replace("#", "")}`;
  const { path } = edgeGeometry(style, 6, 12, 130, 12);
  const dashArray = edgeDashArray(style);
  const common = {
    stroke: color,
    strokeWidth: 2,
    strokeDasharray: dashArray,
    strokeLinecap: (style === "dotted" ? "round" : "butt") as "round" | "butt",
    fill: "none",
    markerEnd: `url(#${markerId})`,
  };

  return (
    <svg width="140" height="24" style={{ display: "block" }} aria-hidden="true">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      {path ? (
        <path d={path} {...common}>
          {style === "animated" && !prefersReducedMotion && (
            <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
          )}
        </path>
      ) : (
        <line x1={6} y1={12} x2={130} y2={12} {...common}>
          {style === "animated" && !prefersReducedMotion && (
            <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
          )}
        </line>
      )}
    </svg>
  );
}

export default function WorkflowDesigner({ definition, onChange, readOnly = false }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [newEdgeStyle, setNewEdgeStyle] = useState<EdgeStyle>("solid");
  const [newEdgeColor, setNewEdgeColor] = useState("#475569");
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedNode = definition.nodes.find((n) => n.id === selectedId) || null;
  const nodeById = new Map(definition.nodes.map((n) => [n.id, n]));
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function emit(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    onChange({ ...definition, nodes, edges });
  }

  function addNode(type: WorkflowNode["type"]) {
    const baseX = definition.nodes.length * NODE_GAP_X;
    const baseY = 200 + Math.random() * 60;
    const node: WorkflowNode = {
      id: genNodeId(),
      type,
      label: `New ${type}`,
      position: { x: baseX, y: baseY },
    };
    emit([...definition.nodes, node], definition.edges);
    setSelectedId(node.id);
  }

  function updateNode(id: string, updates: Partial<WorkflowNode>) {
    emit(
      definition.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      definition.edges
    );
  }

  function removeNode(id: string) {
    emit(
      definition.nodes.filter((n) => n.id !== id),
      definition.edges.filter((e) => e.source !== id && e.target !== id)
    );
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function addEdge(source: string, target: string) {
    if (source === target) return;
    if (definition.edges.some((e) => e.source === source && e.target === target)) return;
    emit(definition.nodes, [
      ...definition.edges,
      { id: genEdgeId(), source, target, style: newEdgeStyle, color: newEdgeColor },
    ]);
  }

  function updateEdge(id: string, updates: Partial<WorkflowEdge>) {
    emit(
      definition.nodes,
      definition.edges.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }

  function removeEdge(id: string) {
    emit(definition.nodes, definition.edges.filter((e) => e.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = definition.nodes.findIndex((n) => n.id === active.id);
    const newIndex = definition.nodes.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    emit(arrayMove(definition.nodes, oldIndex, newIndex), definition.edges);
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]")) {
      setSelectedId(null);
      setConnectingFrom(null);
    }
  }

  function autoLayoutAll() {
    emit(autoLayout(definition.nodes), definition.edges);
  }

  function toggleConnectMode() {
    setConnectingFrom((prev) => (prev ? null : selectedId));
  }

  function handleNodeClick(nodeId: string) {
    if (connectingFrom && connectingFrom !== nodeId) {
      addEdge(connectingFrom, nodeId);
      setConnectingFrom(null);
      return;
    }
    setSelectedId(nodeId);
    setConnectingFrom(null);
  }

  const nodeIds = definition.nodes.map((n) => n.id);

  return (
    <S.DesignerWrapper>
      <S.Toolbar>
        <S.ToolbarGroup>
          <S.ToolbarLabel>Add Node:</S.ToolbarLabel>
          {NODE_TYPES.map((type) => (
            <S.AddButton
              key={type}
              $color={NODE_COLORS[type]}
              onClick={() => addNode(type)}
            >
              + {type}
            </S.AddButton>
          ))}
        </S.ToolbarGroup>
        <S.ToolbarGroup>
          <S.ActionButton onClick={autoLayoutAll}>Auto Layout</S.ActionButton>
          <S.ActionButton
            onClick={toggleConnectMode}
            style={{
              background: connectingFrom ? "rgba(239, 68, 68, 0.2)" : "transparent",
              borderColor: connectingFrom ? "#ef4444" : "#475569",
              color: connectingFrom ? "#ef4444" : "#94a3b8",
            }}
          >
            {connectingFrom ? "Cancel Connect" : "Connect"}
          </S.ActionButton>
        </S.ToolbarGroup>
      </S.Toolbar>

      <S.CanvasContainer ref={canvasRef} onClick={handleCanvasClick}>
        <div data-canvas-bg style={{ position: "absolute", inset: 0, zIndex: 0 }} />

        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
          <defs>
            {Array.from(new Set(definition.edges.map((e) => e.color || "#475569"))).map((color) => (
              <marker
                key={color}
                id={`edge-arrow-${color.replace("#", "")}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            ))}
          </defs>
          {definition.edges.map((edge) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;

            const style =
              edge.style ?? (source.type === "decision" || source.type === "condition" ? "dashed" : "solid");
            const color = edge.color ?? "#475569";

            const x1 = source.position.x + NODE_WIDTH / 2;
            const y1 = source.position.y + NODE_HEIGHT / 2;
            const x2 = target.position.x + NODE_WIDTH / 2;
            const y2 = target.position.y + NODE_HEIGHT / 2;
            const { path, midX, midY } = edgeGeometry(style, x1, y1, x2, y2);

            const isHovered = hoveredEdge === edge.id;
            const dashArray = edgeDashArray(style);
            const common = {
              stroke: isHovered ? "#ef4444" : color,
              strokeWidth: isHovered ? 3 : 2,
              strokeDasharray: dashArray,
              strokeLinecap: (style === "dotted" ? "round" : "butt") as "round" | "butt",
              fill: "none",
              markerEnd: `url(#edge-arrow-${color.replace("#", "")})`,
              style: { pointerEvents: "stroke" as const, cursor: "pointer" as const },
              onMouseEnter: () => setHoveredEdge(edge.id),
              onMouseLeave: () => setHoveredEdge(null),
              onClick: (e: React.MouseEvent) => { e.stopPropagation(); removeEdge(edge.id); },
            };

            return (
              <g key={edge.id}>
                {path ? (
                  <path d={path} {...common}>
                    {style === "animated" && !prefersReducedMotion && (
                      <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
                    )}
                  </path>
                ) : (
                  <line x1={x1} y1={y1} x2={x2} y2={y2} {...common}>
                    {style === "animated" && !prefersReducedMotion && (
                      <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
                    )}
                  </line>
                )}
                {edge.label && (
                  <text
                    x={midX} y={midY - 8}
                    fill="#94a3b8"
                    fontSize={11}
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={nodeIds} strategy={verticalListSortingStrategy}>
            {definition.nodes.map((node) => (
              <WorkflowNodeCard
                key={node.id}
                node={node}
                selected={selectedId === node.id}
                onSelect={() => handleNodeClick(node.id)}
                onUpdate={(updates) => updateNode(node.id, updates)}
                onRemove={() => removeNode(node.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {definition.nodes.length === 0 && (
          <S.EmptyCanvas>
            <p>No workflow steps yet.</p>
            <p>Use the toolbar above to add nodes, or select a template to start.</p>
          </S.EmptyCanvas>
        )}
      </S.CanvasContainer>

      {selectedNode && (
        <S.PropertiesPanel>
          <S.PropertiesTitle>Step Properties</S.PropertiesTitle>
          <S.PropRow>
            <S.PropLabel>Label</S.PropLabel>
            <S.PropInput
              value={selectedNode.label}
              onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            />
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Description</S.PropLabel>
            <S.PropTextarea
              value={selectedNode.description || ""}
              onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
            />
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Type</S.PropLabel>
            <S.PropSelect
              value={selectedNode.type}
              onChange={(e) => updateNode(selectedNode.id, { type: e.target.value as WorkflowNode["type"] })}
            >
              <option value="start">Start</option>
              <option value="process">Process</option>
              <option value="decision">Decision</option>
              <option value="condition">Condition</option>
              <option value="end">End</option>
            </S.PropSelect>
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Position X</S.PropLabel>
            <S.PropInput
              type="number"
              value={selectedNode.position.x}
              onChange={(e) => updateNode(selectedNode.id, { position: { ...selectedNode.position, x: Number(e.target.value) } })}
            />
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Position Y</S.PropLabel>
            <S.PropInput
              type="number"
              value={selectedNode.position.y}
              onChange={(e) => updateNode(selectedNode.id, { position: { ...selectedNode.position, y: Number(e.target.value) } })}
            />
          </S.PropRow>

          <S.PropertiesTitle style={{ marginTop: 16 }}>Connections</S.PropertiesTitle>
          {connectingFrom && (
            <S.ConnectInfo style={{ color: "#fbbf24", fontStyle: "normal" }}>
              Connect mode active. Click another node to create a connection from "{selectedNode?.label}".
            </S.ConnectInfo>
          )}
          <S.PropRow>
            <S.PropLabel>Line style</S.PropLabel>
            <S.PropSelect
              value={newEdgeStyle}
              onChange={(e) => setNewEdgeStyle(e.target.value as EdgeStyle)}
            >
              {EDGE_STYLES.map((s) => (
                <option key={s} value={s}>{capitalize(s)}</option>
              ))}
            </S.PropSelect>
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Color</S.PropLabel>
            <S.PropSelect
              value={newEdgeColor}
              onChange={(e) => setNewEdgeColor(e.target.value)}
            >
              {EDGE_COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </S.PropSelect>
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Preview</S.PropLabel>
            <EdgePreview style={newEdgeStyle} color={newEdgeColor} />
          </S.PropRow>
          <S.PropRow>
            <S.PropLabel>Connect to</S.PropLabel>
            <S.PropSelect
              value=""
              onChange={(e) => {
                if (e.target.value) addEdge(selectedNode.id, e.target.value);
              }}
            >
              <option value="">Select a node...</option>
              {definition.nodes
                .filter((n) => n.id !== selectedNode.id)
                .filter((n) => !definition.edges.some((e) => e.source === selectedNode.id && e.target === n.id))
                .map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
            </S.PropSelect>
          </S.PropRow>
          <S.EdgeList>
            {definition.edges
              .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
              .map((edge) => {
                const other = nodeById.get(edge.source === selectedNode.id ? edge.target : edge.source);
                const edgeSource = edge.source === selectedNode.id ? selectedNode : other;
                const edgeDefaultStyle =
                  edgeSource?.type === "decision" || edgeSource?.type === "condition" ? "dashed" : "solid";
                return (
                  <S.EdgeItem key={edge.id}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>
                      {edge.source === selectedNode.id ? "→" : "←"} {other?.label || other?.id}
                    </span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <S.PropSelect
                        value={edge.style ?? edgeDefaultStyle}
                        onChange={(e) => updateEdge(edge.id, { style: e.target.value as EdgeStyle })}
                        style={{ flex: "0 0 86px", padding: "2px 22px 2px 6px", fontSize: 11 }}
                        title="Line style"
                      >
                        {EDGE_STYLES.map((s) => (
                          <option key={s} value={s}>{capitalize(s)}</option>
                        ))}
                      </S.PropSelect>
                      <S.PropSelect
                        value={edge.color ?? "#475569"}
                        onChange={(e) => updateEdge(edge.id, { color: e.target.value })}
                        style={{ flex: "0 0 82px", padding: "2px 22px 2px 6px", fontSize: 11 }}
                        title="Color"
                      >
                        {EDGE_COLORS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </S.PropSelect>
                      <button
                        onClick={() => removeEdge(edge.id)}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                      >✕</button>
                    </div>
                  </S.EdgeItem>
                );
              })}
            {definition.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
              <S.EdgeItem style={{ color: "#475569", fontSize: 12 }}>No connections</S.EdgeItem>
            )}
          </S.EdgeList>

          {!connectingFrom && (
            <S.ConnectInfo>
              Select a node, then click "Connect" to create a connection to another node.
              Click an existing edge line to remove it.
            </S.ConnectInfo>
          )}
        </S.PropertiesPanel>
      )}
    </S.DesignerWrapper>
  );
}
