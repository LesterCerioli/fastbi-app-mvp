import styled from "styled-components";

export const DesignerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-wrap: wrap;
  gap: 8px;
`;

export const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const ToolbarLabel = styled.span`
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-right: 4px;
`;

export const AddButton = styled.button<{ $color: string }>`
  background: ${({ $color }) => `${$color}20`};
  border: 1px solid ${({ $color }) => $color};
  border-radius: 6px;
  padding: 4px 10px;
  color: ${({ $color }) => $color};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;

  &:hover {
    background: ${({ $color }) => $color};
    color: #fff;
  }
`;

export const ActionButton = styled.button`
  background: transparent;
  border: 1px solid #475569;
  border-radius: 6px;
  padding: 4px 12px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #334155;
    color: #f1f5f9;
  }
`;

export const CanvasContainer = styled.div`
  position: relative;
  min-height: 500px;
  overflow: auto;
  padding: 40px;
  background:
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
    #0a0f1f;
  cursor: default;
`;

export const EmptyCanvas = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
  font-size: 14px;
  text-align: center;
  gap: 4px;
  z-index: 0;

  p {
    margin: 0;
  }
`;

export const PropertiesPanel = styled.div`
  background: #1e293b;
  border-top: 1px solid #334155;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const PropertiesTitle = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const PropRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const PropLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  width: 90px;
  flex-shrink: 0;
`;

export const PropInput = styled.input`
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 10px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const PropTextarea = styled.textarea`
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 10px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  resize: vertical;
  min-height: 50px;
  font-family: inherit;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const PropSelect = styled.select`
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 10px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  padding-right: 28px;

  &:focus {
    border-color: #22c55e;
  }

  option {
    background: #0f172a;
    color: #f1f5f9;
  }
`;

export const EdgeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const EdgeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #0f172a;
  border-radius: 4px;
`;

export const ConnectInfo = styled.p`
  margin: 4px 0 0;
  font-size: 11px;
  color: #475569;
  font-style: italic;
  line-height: 1.4;
`;
