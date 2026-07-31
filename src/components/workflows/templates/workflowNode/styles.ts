import styled from "styled-components";
import { NODE_WIDTH, NODE_HEIGHT, NODE_COLORS } from "../workflowTypes";
import type { WorkflowNode } from "../workflowTypes";

export const NodeCard = styled.div<{ $selected: boolean; $type: WorkflowNode["type"] }>`
  position: absolute;
  width: ${NODE_WIDTH}px;
  min-height: ${NODE_HEIGHT}px;
  background: #0f172a;
  border: 2px solid ${({ $selected, $type }) => ($selected ? NODE_COLORS[$type] : "#334155")};
  border-radius: 12px;
  padding: 12px;
  cursor: grab;
  z-index: ${({ $selected }) => ($selected ? 2 : 1)};
  box-shadow: ${({ $selected, $type }) => ($selected ? `0 0 0 2px ${NODE_COLORS[$type]}40` : "none")};

  &:active {
    cursor: grabbing;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const TypeBadge = styled.span<{ $color: string }>`
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
`;

export const RemoveBtn = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #ef4444;
  }
`;

export const LabelInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1px solid #334155;
  color: #f1f5f9;
  font-size: 13px;
  font-weight: 600;
  width: 100%;
  padding: 2px 0;
  outline: none;
  margin-bottom: 4px;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const DescInput = styled.input`
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 11px;
  width: 100%;
  padding: 0;
  outline: none;

  &::placeholder {
    color: #475569;
  }
`;

export const TypeSelect = styled.select`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #cbd5e1;
  font-size: 10px;
  padding: 2px 4px;
  outline: none;
  cursor: pointer;
  margin-top: 6px;
`;
