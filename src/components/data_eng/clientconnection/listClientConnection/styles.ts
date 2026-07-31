import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

export const Wrapper = styled.div`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const Title = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
`;

export const ConnectionsCount = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6b8388;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 12px;
  border-radius: 20px;
`;

export const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Card = styled.div<{ $index: number }>`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: border-color 0.2s, background 0.2s;
  animation: ${fadeInUp} 0.4s ease-out backwards;
  animation-delay: ${({ $index }) => $index * 0.05}s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.14);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 18px;
  }
`;

export const CardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

export const DbIcon = styled.div<{ $type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-family: "Inter", system-ui, sans-serif;
  flex-shrink: 0;

  background: ${({ $type }) =>
    $type === "postgresql"
      ? "rgba(52, 152, 219, 0.15)"
      : $type === "mysql"
      ? "rgba(0, 117, 143, 0.15)"
      : $type === "mariadb"
      ? "rgba(193, 98, 30, 0.15)"
      : $type === "mssql"
      ? "rgba(169, 169, 169, 0.15)"
      : $type === "oracle"
      ? "rgba(200, 50, 50, 0.15)"
      : "rgba(255, 255, 255, 0.08)"};

  color: ${({ $type }) =>
    $type === "postgresql"
      ? "#3498db"
      : $type === "mysql"
      ? "#00758f"
      : $type === "mariadb"
      ? "#c1621e"
      : $type === "mssql"
      ? "#a9a9a9"
      : $type === "oracle"
      ? "#c83232"
      : "#ffffff"};
`;

export const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const ConnectionName = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ConnectionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const MetaTag = styled.span<{ $noDot?: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #8ba3a8;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: "";
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #6b8388;
    display: ${({ $noDot }) => ($noDot ? "none" : "inline-block")};
  }
`;

export const CardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

export const StatusBadge = styled.span<{ $active: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 20px;

  background: ${({ $active }) =>
    $active ? "rgba(52, 211, 153, 0.12)" : "rgba(239, 68, 68, 0.12)"};

  color: ${({ $active }) =>
    $active ? "#34d399" : "#ef4444"};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const IconButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #6b8388;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const Empty = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

export const EmptyIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 4px;
`;

export const EmptyText = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #6b8388;
  line-height: 1.5;
  max-width: 300px;
`;

export const OrgInputInline = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 12px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  text-align: center;
  max-width: 280px;
  margin-top: 8px;
  transition: border-color 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
  }
`;

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.20);
  border-radius: 14px;
  padding: 16px 20px;
  color: #fca5a5;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const RetryButton = styled.button`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.30);
  border-radius: 8px;
  padding: 6px 14px;
  color: #fca5a5;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.06);
  border-top-color: #34d399;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 0;
`;

export const LoadingText = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #6b8388;
`;

export const SkeletonCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const SkeletonIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  flex-shrink: 0;
`;

export const SkeletonLine = styled.div<{ $width?: string }>`
  height: 14px;
  width: ${({ $width }) => $width || "200px"};
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
`;

export const SkeletonLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;
