"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type WorkflowNode, NODE_COLORS, typeLabels } from "../workflowTypes";
import * as S from "./styles";

interface Props {
  node: WorkflowNode;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
  onRemove: () => void;
}

export default function WorkflowNodeCard({ node, selected, onSelect, onUpdate, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    left: node.position.x,
    top: node.position.y,
  };

  return (
    <S.NodeCard
      ref={setNodeRef}
      style={style}
      $selected={selected}
      $type={node.type}
      onClick={onSelect}
    >
      <S.Header {...attributes} {...listeners}>
        <S.TypeBadge $color={NODE_COLORS[node.type]}>
          {typeLabels[node.type]}
        </S.TypeBadge>
        <S.RemoveBtn onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          ✕
        </S.RemoveBtn>
      </S.Header>

      <S.LabelInput
        value={node.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Step name"
      />

      <S.DescInput
        value={node.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Description (optional)"
      />

      <S.TypeSelect
        value={node.type}
        onChange={(e) => onUpdate({ type: e.target.value as WorkflowNode["type"] })}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="start">Start</option>
        <option value="process">Process</option>
        <option value="decision">Decision</option>
        <option value="condition">Condition</option>
        <option value="end">End</option>
      </S.TypeSelect>
    </S.NodeCard>
  );
}
