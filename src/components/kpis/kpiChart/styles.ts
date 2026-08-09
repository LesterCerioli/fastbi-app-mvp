import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const ChartBlock = styled.div`
  width: 100%;
`;

export const ChartHeader = styled.h4`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #e0f2ff;
  margin: 0 0 12px;
`;

export const ChartSection = styled.div`
  margin-bottom: 18px;
`;

export const ChartTitle = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #6b8388;
  margin: 0 0 8px;
`;

export const ChartWrap = styled.div`
  width: 100%;
  height: 240px;
`;

export const TotalRow = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin: 8px 0 0;
  text-align: center;
`;

export const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
`;

export const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: #22d3ee;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

export const LoadingText = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #6b8388;
`;

export const EmptyText = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #6b8388;
  padding: 18px 0;
  text-align: center;
`;

export const ErrorText = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #f87171;
  padding: 12px 0;
`;