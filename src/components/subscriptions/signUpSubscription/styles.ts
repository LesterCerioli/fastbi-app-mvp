import styled, { keyframes, css } from "styled-components";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

export const Title = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 4px;
`;

export const Subtitle = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 24px;
`;

export const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
`;

export const ToggleRow = styled.div`
  display: flex;
  gap: 0;
  background: #1e293b;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
`;

export const ToggleOption = styled.button<{ $active: boolean }>`
  flex: 1;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Inter", system-ui, sans-serif;
  background: ${({ $active }) => ($active ? "#22c55e" : "transparent")};
  color: ${({ $active }) => ($active ? "#04210f" : "#94a3b8")};

  &:hover {
    color: ${({ $active }) => ($active ? "#04210f" : "#f1f5f9")};
  }
`;

export const PlanGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

export const PlanCard = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  background: ${({ $selected }) =>
    $selected ? "rgba(34, 197, 94, 0.08)" : "transparent"};
  border: 1px solid ${({ $selected }) =>
    $selected ? "rgba(52, 211, 153, 0.4)" : "#1e293b"};
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: "Inter", system-ui, sans-serif;

  &:hover {
    border-color: ${({ $selected }) =>
      $selected ? "rgba(52, 211, 153, 0.6)" : "#334155"};
    background: ${({ $selected }) =>
      $selected ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.02)"};
  }

  ${({ $selected }) =>
    $selected &&
    css`
      &::before {
        content: "";
        position: absolute;
        inset: -2px;
        border-radius: 14px;
        background: linear-gradient(
          140deg,
          rgba(52, 211, 153, 0.3),
          rgba(34, 211, 238, 0.15)
        );
        filter: blur(12px);
        opacity: 0.4;
        z-index: -1;
        animation: ${pulse} 5s ease-in-out infinite;
      }
    `}

  position: relative;
  overflow: hidden;
`;

export const PlanRadio = styled.div<{ $selected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? "#22c55e" : "#334155")};
  background: ${({ $selected }) => ($selected ? "#22c55e" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #04210f;
    display: ${({ $selected }) => ($selected ? "block" : "none")};
  }
`;

export const PlanInfo = styled.div`
  flex: 1;
`;

export const PlanName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 2px;
`;

export const PlanDesc = styled.div`
  font-size: 12px;
  color: #64748b;
`;

export const PlanLimit = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #22c55e;
  margin-top: 4px;
`;

export const PlanPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  text-align: right;
  white-space: nowrap;
`;

export const PlanPricePeriod = styled.div`
  font-size: 11px;
  color: #64748b;
  text-align: right;
`;

export const SummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
`;

export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    margin-bottom: 6px;
    padding-bottom: 12px;
  }
`;

export const SummaryLabel = styled.span`
  font-size: 13px;
  color: #94a3b8;
`;

export const SummaryValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
`;

export const TotalRow = styled(SummaryRow)`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding-top: 12px;
`;

export const TotalLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
`;

export const TotalValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #22c55e;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #1e293b;
`;

export const Button = styled.button`
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Inter", system-ui, sans-serif;
  background: #22c55e;
  color: #04210f;

  &:hover {
    background: #16a34a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 20px;
`;

export const UserField = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

export const Input = styled.input<{ $invalid?: boolean }>`
  width: 96px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $invalid }) => ($invalid ? "#ef4444" : "#334155")};
  background: rgba(255, 255, 255, 0.04);
  color: #f1f5f9;
  font-size: 14px;
  font-family: "Inter", system-ui, sans-serif;
  outline: none;

  &:focus {
    border-color: #22c55e;
  }
`;

export const UserHint = styled.span`
  font-size: 12px;
  color: #64748b;
`;
