import styled, { css } from "styled-components";

const fadeIn = css`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const Page = styled.main`
  width: 100%;
  min-height: 100vh;
  background: #04190f;
  position: relative;
  overflow-x: hidden;
`;

export const PageBg = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(900px 700px at 30% 0%, rgba(34, 197, 94, 0.20), transparent 60%),
    radial-gradient(1100px 900px at 100% 100%, rgba(8, 75, 140, 0.40), transparent 55%),
    linear-gradient(135deg, #04190f 0%, #06241a 45%, #061d33 100%);
  pointer-events: none;
`;

export const Content = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  min-height: 100vh;
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
