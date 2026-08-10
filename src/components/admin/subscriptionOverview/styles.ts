import styled from "styled-components";

export const Wrapper = styled.div`
  min-height: 100vh;
  background: #0A0F1F;
  color: #FFFFFF;
  padding: 120px 40px 60px;

  @media (max-width: 768px) {
    padding: 110px 20px 40px;
  }
`;

export const Container = styled.div`
  max-width: 1020px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease-out;
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 24px;
`;

export const Card = styled.div`
  background: rgba(17, 34, 61, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  margin-bottom: 24px;
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 20px;

  svg {
    color: #00D4FF;
  }
`;

export const SectionSubtitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #E2E8F0;
  margin: 24px 0 12px;
`;

export const OverdueCount = styled.span`
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
`;

export const Table = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr 1fr 1fr;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;

  @media (max-width: 720px) {
    display: none;
  }
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr 1fr 1fr;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  align-items: center;
  font-size: 14px;
  color: #E2E8F0;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

export const OrgName = styled.span`
  font-weight: 600;
  color: #FFFFFF;
`;

export const StatusBadge = styled.span<{ $tone?: "success" | "warning" | "danger" | "neutral" }>`
  justify-self: start;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $tone }) =>
    $tone === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : $tone === "warning"
        ? "rgba(245, 158, 11, 0.15)"
        : $tone === "danger"
          ? "rgba(239, 68, 68, 0.15)"
          : "rgba(148, 163, 184, 0.15)"};
  color: ${({ $tone }) =>
    $tone === "success"
      ? "#4ade80"
      : $tone === "warning"
        ? "#fbbf24"
        : $tone === "danger"
          ? "#f87171"
          : "#94A3B8"};
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #94A3B8;
  font-size: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  justify-content: center;
`;

export const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #94A3B8;
  font-size: 14px;
  justify-content: center;
`;
