import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
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
  color: #ffffff;
  margin-bottom: 20px;

  svg {
    color: #00d4ff;
  }
`;

export const SectionSubtitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 24px 0 12px;
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 28px;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
`;

export const Table = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 1fr 0.8fr 0.9fr;
  gap: 12px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    display: none;
  }
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 1fr 0.8fr 0.9fr;
  gap: 12px;
  padding: 12px 14px;
  align-items: center;
  font-size: 14px;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 14px;
  }
`;

export const CellLabel = styled.span`
  display: none;

  @media (max-width: 768px) {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
  }
`;

export const Cell = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StatusBadge = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  background: ${({ $tone }) =>
    $tone === "success"
      ? "rgba(16, 185, 129, 0.15)"
      : $tone === "danger"
      ? "rgba(239, 68, 68, 0.15)"
      : $tone === "warning"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(100, 116, 139, 0.15)"};
  color: ${({ $tone }) =>
    $tone === "success"
      ? "#34d399"
      : $tone === "danger"
      ? "#f87171"
      : $tone === "warning"
      ? "#fbbf24"
      : "#94a3b8"};
`;

export const ErrorBox = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  font-size: 14px;
`;