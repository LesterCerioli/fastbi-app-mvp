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
  gap: 12px;
  margin-bottom: 20px;
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

export const Title = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
`;

export const FilesCount = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.10);
  padding: 4px 12px;
  border-radius: 20px;
`;

const spinIcon = keyframes`
  to { transform: rotate(360deg); }
`;

export const RefreshButton = styled.button<{ $spinning?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #7dd3fc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s, color 0.2s;

  svg {
    animation: ${({ $spinning }) =>
      $spinning ? `${spinIcon} 0.8s linear infinite` : "none"};
  }

  &:hover {
    background: rgba(56, 189, 248, 0.12);
    border-color: rgba(56, 189, 248, 0.25);
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
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
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  animation: ${fadeInUp} 0.4s ease-out backwards;
  animation-delay: ${({ $index }) => $index * 0.05}s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(56, 189, 248, 0.18);
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 16px;
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

export const ExtensionTile = styled.div<{ $extension: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  font-family: "Space Grotesk", system-ui, sans-serif;
  flex-shrink: 0;

  background: ${({ $extension }) =>
    $extension === "csv" || $extension === "tsv"
      ? "rgba(56, 189, 248, 0.15)"
      : $extension === "xlsx" || $extension === "xls"
      ? "rgba(52, 211, 153, 0.15)"
      : $extension === "json"
      ? "rgba(167, 139, 250, 0.15)"
      : $extension === "pdf"
      ? "rgba(251, 113, 133, 0.15)"
      : "rgba(148, 163, 184, 0.15)"};

  color: ${({ $extension }) =>
    $extension === "csv" || $extension === "tsv"
      ? "#38bdf8"
      : $extension === "xlsx" || $extension === "xls"
      ? "#34d399"
      : $extension === "json"
      ? "#a78bfa"
      : $extension === "pdf"
      ? "#fb7185"
      : "#94a3b8"};
`;

export const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const FileName = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const MetaTag = styled.span<{ $noDot?: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
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

export const StatusBadge = styled.span<{ $status: string }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 20px;

  background: ${({ $status }) =>
    $status === "processed"
      ? "rgba(52, 211, 153, 0.12)"
      : $status === "unsupported"
      ? "rgba(251, 191, 36, 0.12)"
      : "rgba(148, 163, 184, 0.12)"};

  color: ${({ $status }) =>
    $status === "processed"
      ? "#34d399"
      : $status === "unsupported"
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
  background: rgba(56, 189, 248, 0.10);
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
    border-color: #38bdf8;
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
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

  &:focus-visible {
    outline: 2px solid #fca5a5;
    outline-offset: 2px;
  }
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.06);
  border-top-color: #38bdf8;
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
  padding: 16px 20px;
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

export const Chevron = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b8388;
  flex-shrink: 0;
  transition: color 0.2s, transform 0.2s;

  ${Card}:hover & {
    color: #38bdf8;
    transform: translateX(2px);
  }
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(2, 10, 8, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeInUp} 0.25s ease-out;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

export const Modal = styled.div`
  background: #0a1f18;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  width: 100%;
  max-width: 960px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

export const ModalTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

export const ModalTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const ModalTitle = styled.h4`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ModalMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #8ba3a8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.12);
    color: #fca5a5;
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }
`;

export const ModalBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SearchToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const SearchBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  color: #6b8388;
  pointer-events: none;
`;

export const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 10px 36px 10px 38px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #38bdf8;
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 1px;
  }
`;

export const ClearSearchButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #6b8388;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fca5a5;
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 1px;
  }
`;

export const SearchResultHint = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #8ba3a8;
  font-variant-numeric: tabular-nums;
`;

export const TableWrap = styled.div`
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  max-height: 55vh;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12.5px;
  min-width: 100%;
`;

export const THead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 1;
  background: #0d2a20;

  th {
    text-align: left;
  }
`;

export const Th = styled.th`
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #7dd3fc;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  white-space: nowrap;
`;

export const Td = styled.td<{ $numeric?: boolean }>`
  padding: 9px 14px;
  color: #d5e3e6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  text-align: ${({ $numeric }) => ($numeric ? "right" : "left")};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;

  tbody tr:nth-child(even) & {
    background: rgba(255, 255, 255, 0.02);
  }
`;

export const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const PaginationInfo = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #8ba3a8;
  font-variant-numeric: tabular-nums;
`;

export const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const PaginationButton = styled.button`
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 8px;
  padding: 6px 14px;
  color: #7dd3fc;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.18);
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;
