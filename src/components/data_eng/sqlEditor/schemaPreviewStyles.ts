import styled from "styled-components";

export const Wrapper = styled.aside`
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Title = styled.h4`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #ffffff;
  margin: 0;
`;

export const CountBadge = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  color: #6b8388;
`;

export const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 9px 12px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
  }
`;

export const FlatList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 4px;
`;

export const TableLine = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  padding: 9px 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: #d4f0e6;
  text-align: left;
  border-radius: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.5);
  }
`;

export const TableName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

export const ColLine = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 4px 7px 28px;
  border-radius: 6px;
  min-width: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

export const ColName = styled.span`
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12.5px;
  color: #e8f5ef;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
`;

export const ColType = styled.span`
  font-size: 11.5px;
  color: #6b8388;
  white-space: nowrap;
  flex-shrink: 0;
`;

export const KeyMark = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fbbf24;
  width: 18px;
  flex-shrink: 0;
`;

export const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 4px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #6b8388;
`;

export const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-top-color: #34d399;
  border-radius: 50%;
  animation: schemaspin 0.7s linear infinite;

  @keyframes schemaspin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`;

export const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.20);
  border-radius: 10px;
  padding: 10px 14px;
  color: #fca5a5;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RetryButton = styled.button`
  align-self: flex-start;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  padding: 5px 12px;
  color: #fca5a5;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(252, 165, 165, 0.5);
  }
`;

export const EmptyBox = styled.div`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #6b8388;
  padding: 14px 4px;
  text-align: center;
`;
