import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Block = styled.div`
  width: 100%;
  margin-top: 24px;
`;

export const Header = styled.h4`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #e0f2ff;
  margin: 0 0 12px;
`;

export const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
`;

export const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(34, 211, 238, 0.25);
  border-top-color: #22d3ee;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const LoadingText = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #94a3b8;
`;

export const Text = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  padding: 12px 0;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 18px;
`;

export const ChartItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 18px;
`;

export const ChartLabel = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #22d3ee;
  letter-spacing: 0.04em;
  margin: 0 0 10px;
  text-transform: uppercase;
`;