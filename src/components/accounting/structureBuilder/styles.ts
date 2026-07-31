import styled from "styled-components";

export const BuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const Required = styled.span`
  color: #ef4444;
`;

export const EmptyHint = styled.p`
  color: #475569;
  font-size: 13px;
  font-style: italic;
  margin: 8px 0;
`;

export const SuggestRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const Select = styled.select`
  flex: 1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
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
    background: #1e293b;
    color: #f1f5f9;
  }
`;

export const SmallButton = styled.button`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 12px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover {
    background: #334155;
    color: #f1f5f9;
  }
`;

export const StageCard = styled.div`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 14px;
`;

export const StageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DragHandle = styled.span`
  cursor: grab;
  color: #475569;
  font-size: 18px;
  line-height: 1;
  user-select: none;
  padding: 0 4px;

  &:active {
    cursor: grabbing;
  }
`;

export const StageInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid #334155;
  padding: 4px 0;
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 600;
  outline: none;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: #ef4444;
  }
`;

export const StageBody = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ProbabilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ProbabilityLabel = styled.span`
  font-size: 12px;
  color: #94a3b8;
  width: 110px;
  flex-shrink: 0;
`;

export const ProbabilitySlider = styled.input`
  flex: 1;
  accent-color: #22c55e;
  cursor: pointer;
`;

export const ToggleRow = styled.div`
  display: flex;
  gap: 16px;
`;

export const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  cursor: pointer;
`;

export const Checkbox = styled.input`
  accent-color: #22c55e;
  cursor: pointer;
`;

export const TagInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const TagInput = styled.input`
  flex: 1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
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

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #cbd5e1;
`;

export const TagRemove = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #ef4444;
  }
`;

export const DeadlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

export const DeadlineSelect = styled.select`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
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
    background: #1e293b;
    color: #f1f5f9;
  }
`;
