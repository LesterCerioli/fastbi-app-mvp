import styled, { keyframes } from "styled-components";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  margin-top: 4px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const Input = styled.input`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const StripeElement = styled.div`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #22c55e;
  }
`;

export const NativeInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  color: #f1f5f9;
  font-size: 14px;
  font-family: "Inter", system-ui, sans-serif;

  &::placeholder {
    color: #475569;
  }
`;

export const CardRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const AcceptedCards = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  flex-wrap: wrap;
`;

export const CardIcon = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const SummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 20px 0 24px;
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
  padding-top: 20px;
  border-top: 1px solid #1e293b;
`;

export const Button = styled.button<{ $loading?: boolean }>`
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Inter", system-ui, sans-serif;
  background: #22c55e;
  color: #04210f;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #16a34a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Spinner = styled.div<{ $visible?: boolean }>`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(4, 33, 15, 0.3);
  border-top-color: #04210f;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
  display: ${({ $visible }) => ($visible ? "inline-block" : "none")};
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
