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

export const Count = styled.span`
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

export const Card = styled.div<{ $index: number; $expanded: boolean }>`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  animation: ${fadeInUp} 0.4s ease-out backwards;
  animation-delay: ${({ $index }) => $index * 0.05}s;

  background: ${({ $expanded }) =>
    $expanded ? "rgba(52, 211, 153, 0.06)" : "rgba(255, 255, 255, 0.04)"};
  border-color: ${({ $expanded }) =>
    $expanded ? "rgba(52, 211, 153, 0.28)" : "rgba(255, 255, 255, 0.08)"};

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.14);
  }

  &:hover {
    background: ${({ $expanded }) =>
      $expanded ? "rgba(52, 211, 153, 0.08)" : "rgba(255, 255, 255, 0.06)"};
    border-color: ${({ $expanded }) =>
      $expanded ? "rgba(52, 211, 153, 0.4)" : "rgba(255, 255, 255, 0.14)"};
  }

  &:focus-visible {
    outline: 2px solid rgba(52, 211, 153, 0.5);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 18px;
  }
`;

export const CardItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Chevron = styled.span<{ $expanded: boolean }>`
  color: #6b8388;
  font-size: 13px;
  transition: transform 0.25s ease, color 0.2s;
  transform: ${({ $expanded }) => ($expanded ? "rotate(180deg)" : "rotate(0deg)")};

  ${Card}:hover & {
    color: #34d399;
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

export const KpiIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-family: "Inter", system-ui, sans-serif;
  flex-shrink: 0;
`;

export const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const KpiName = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const KpiMeta = styled.div`
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

export const CodeTag = styled.span<{ $noDot?: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #34d399;
  background: rgba(52, 211, 153, 0.10);
  padding: 2px 8px;
  border-radius: 6px;

  &::before {
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

export const StatusBadge = styled.span<{ $status: string }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 20px;

  background: ${({ $status }) =>
    $status === "active"
      ? "rgba(52, 211, 153, 0.12)"
      : $status === "draft"
      ? "rgba(245, 158, 11, 0.12)"
      : "rgba(148, 163, 184, 0.12)"};

  color: ${({ $status }) =>
    $status === "active"
      ? "#34d399"
      : $status === "draft"
      ? "#fbbf24"
      : "#94a3b8"};
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

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const DetailPanel = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  animation: ${slideDown} 0.25s ease-out;

  @media (max-width: 768px) {
    padding: 16px 18px;
  }
`;

export const ChartPanel = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px 18px;
  }
`;

export const DetailDescription = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DetailLabel = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b8388;
`;

export const DetailText = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: #c8d5d8;
  margin: 0;
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const DetailValue = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #e2edef;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const SeverityChip = styled.span<{ $severity: string }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 2px 8px;
  border-radius: 20px;

  background: ${({ $severity }) =>
    $severity === "critical"
      ? "rgba(239, 68, 68, 0.12)"
      : $severity === "high"
      ? "rgba(249, 115, 22, 0.12)"
      : $severity === "medium"
      ? "rgba(245, 158, 11, 0.12)"
      : "rgba(52, 211, 153, 0.12)"};

  color: ${({ $severity }) =>
    $severity === "critical"
      ? "#f87171"
      : $severity === "high"
      ? "#fb923c"
      : $severity === "medium"
      ? "#fbbf24"
      : "#34d399"};
`;

export const DetailFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const FooterStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const FooterDivider = styled.div`
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    width: 100%;
    height: 1px;
  }
`;

export const FooterValue = styled.span<{ $positive?: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: ${({ $positive }) =>
    $positive === undefined
      ? "#ffffff"
      : $positive
      ? "#34d399"
      : "#f87171"};
`;