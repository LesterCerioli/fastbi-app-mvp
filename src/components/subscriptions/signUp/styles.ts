import styled, { keyframes, css } from "styled-components";

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #04190f;
  padding: 48px 24px;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 1280px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StepsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  gap: 0;
`;

export const StepDotGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const Dot = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $active, $completed }) =>
    $active ? "#22c55e" : $completed ? "#34d399" : "#1e293b"};
  border: 2px solid ${({ $active, $completed }) =>
    $active ? "#22c55e" : $completed ? "#34d399" : "#334155"};
  transition: all 0.3s;
  flex-shrink: 0;
  display: grid;
  place-items: center;

  &::after {
    content: "${({ $completed }) => ($completed ? "✓" : "")}";
    font-size: 7px;
    font-weight: 700;
    color: ${({ $completed }) => ($completed ? "#04210f" : "transparent")};
  }
`;

export const Connector = styled.div<{ $active: boolean }>`
  width: 48px;
  height: 2px;
  background: ${({ $active }) => ($active ? "#22c55e" : "#1e293b")};
  transition: background 0.3s;

  @media (max-width: 768px) {
    width: 24px;
  }
`;

export const StepLabel = styled.span<{ $active: boolean }>`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? "#34d399" : "#475569")};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: color 0.3s;
  text-align: center;
`;

export const CardsRow = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 20px;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const StepCard = styled.div<{
  $state: "upcoming" | "active" | "completed";
}>`
  flex: ${({ $state }) => ($state === "active" ? "1.4" : "1")};
  max-width: ${({ $state }) => ($state === "active" ? "520px" : "340px")};
  min-width: 0;
  opacity: 1;
  pointer-events: ${({ $state }) =>
    $state === "active" ? "auto" : "none"};
  transition: flex 0.3s, max-width 0.3s;

  @media (max-width: 1024px) {
    max-width: 520px;
    width: 100%;
    flex: none;
  }
`;

export const CardInner = styled.div<{ $state: "upcoming" | "active" | "completed" }>`
  background: ${({ $state }) =>
    $state === "completed"
      ? "rgba(34, 197, 94, 0.06)"
      : $state === "active"
        ? "#0f172a"
        : "#0a0f1a"};
  border: 1px solid ${({ $state }) =>
    $state === "completed"
      ? "rgba(52, 211, 153, 0.3)"
      : $state === "active"
        ? "#1e293b"
        : "rgba(30, 41, 59, 0.6)"};
  border-radius: 16px;
  padding: ${({ $state }) =>
    $state === "completed" ? "24px" : "32px"};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  height: 100%;
  display: flex;
  flex-direction: column;

  ${({ $state }) =>
    $state === "completed" &&
    css`
      animation: ${fadeIn} 0.3s ease-out;
      cursor: default;
    `}
`;

export const StepBadge = styled.div<{ $state: "active" | "completed" | "upcoming" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
  color: ${({ $state }) =>
    $state === "completed" ? "#34d399" : "#64748b"};
`;

export const BadgeDot = styled.span<{ $state: "active" | "completed" | "upcoming" }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $state }) =>
    $state === "completed" ? "#34d399" : $state === "active" ? "#22c55e" : "#334155"};
`;

export const CardTitle = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 4px;
`;

export const CardSubtitle = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px;
`;

export const CheckmarkCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  display: grid;
  place-items: center;
  margin-bottom: 16px;

  &::after {
    content: "✓";
    font-size: 18px;
    font-weight: 700;
    color: #22c55e;
  }
`;

export const SummaryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SummaryLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
`;

export const SummaryLabel = styled.span`
  font-size: 12px;
  color: #64748b;
`;

export const SummaryValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
`;

export const PlaceholderCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 16px;
  flex: 1;
`;

export const PlaceholderIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px dashed #334155;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: #334155;
`;

export const PlaceholderText = styled.p`
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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

export const Required = styled.span`
  color: #ef4444;
`;

export const Input = styled.input`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
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

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
`;

export const Button = styled.button<{ $variant?: "primary" | "ghost" }>`
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Inter", system-ui, sans-serif;

  ${({ $variant = "primary" }) =>
    $variant === "primary"
      ? `
    background: #22c55e;
    color: #04210f;
    &:hover { background: #16a34a; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `
      : `
    background: transparent;
    color: #94a3b8;
    &:hover { background: #1e293b; color: #f1f5f9; }
  `}
`;

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 16px;
`;
