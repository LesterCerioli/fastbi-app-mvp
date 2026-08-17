import styled from "styled-components";

export const Wrapper = styled.div`
  margin-top: 24px;
`;

export const Card = styled.div`
  background: rgba(17, 34, 61, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
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

export const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #E2E8F0;
`;

export const Thead = styled.thead`
  background: rgba(255, 255, 255, 0.06);
`;

export const Th = styled.th`
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Tbody = styled.tbody``;

export const Tr = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

export const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: #E2E8F0;
`;

export const StatusBadge = styled.span<{ $online?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $online }) => ($online ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)")};
  color: ${({ $online }) => ($online ? "#4ade80" : "#fca5a5")};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $online }) => ($online ? "#22c55e" : "#ef4444")};
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: #94A3B8;
  font-size: 14px;

  svg {
    color: #00D4FF;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #94A3B8;
  font-size: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
`;

export const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #fca5a5;
  font-size: 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
`;

export const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
  color: #0A0F1F;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  gap: 12px;
`;

export const PaginationInfo = styled.span`
  font-size: 13px;
  color: #94A3B8;
`;

export const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const PaginationButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ $disabled }) => ($disabled ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 212, 255, 0.1)")};
  border: 1px solid ${({ $disabled }) => ($disabled ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 212, 255, 0.35)")};
  color: ${({ $disabled }) => ($disabled ? "#64748B" : "#00D4FF")};
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background: rgba(0, 212, 255, 0.18);
  }
`;