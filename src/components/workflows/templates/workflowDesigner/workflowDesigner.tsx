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
  type WorkflowDefinition,
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

export default function WorkflowDesigner({ definition, onChange, readOnly = false }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedNode = definition.nodes.find((n) => n.id === selectedId) || null;

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
      { id: genEdgeId(), source, target },
    ]);
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
          {definition.edges.map((edge) => {
            const source = definition.nodes.find((n) => n.id === edge.source);
            const target = definition.nodes.find((n) => n.id === edge.target);
            if (!source || !target) return null;

            const x1 = source.position.x + NODE_WIDTH / 2;
            const y1 = source.position.y + NODE_HEIGHT / 2;
            const x2 = target.position.x + NODE_WIDTH / 2;
            const y2 = target.position.y + NODE_HEIGHT / 2;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isHovered = hoveredEdge === edge.id;

            return (
              <g key={edge.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isHovered ? "#ef4444" : "#475569"}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeDasharray={source.type === "decision" || source.type === "condition" ? "6,3" : "none"}
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredEdge(edge.id)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  onClick={(e) => { e.stopPropagation(); removeEdge(edge.id); }}
                />
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
          <S.EdgeList>
            {definition.edges
              .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
              .map((edge) => {
                const other = definition.nodes.find((n) => n.id === (edge.source === selectedNode.id ? edge.target : edge.source));
                return (
                  <S.EdgeItem key={edge.id}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>
                      {edge.source === selectedNode.id ? "→" : "←"} {other?.label || other?.id}
                    </span>
                    <button
                      onClick={() => removeEdge(edge.id)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                    >✕</button>
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
