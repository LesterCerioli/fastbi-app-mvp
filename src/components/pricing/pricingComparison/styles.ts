import styled from "styled-components";

export const SectionHead = styled.div`
  text-align: center;
  margin: 24px 0 40px;
`;

export const SectionTitle = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: clamp(28px, 3.4vw, 40px);
  letter-spacing: -0.5px;
  color: #ffffff;
`;

export const SectionSubtitle = styled.p`
  color: #9db3b8;
  margin-top: 10px;
  font-size: 16px;
`;

export const TableWrap = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);

  @media (max-width: 960px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

export const TableInner = styled.div`
  min-width: 100%;

  @media (max-width: 960px) {
    min-width: 640px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;
`;

export const TH = styled.th`
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;

  &:first-child {
    text-align: left;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 13px;
  }
`;

export const THHighlight = styled(TH)`
  color: #34d399;
`;

export const TD = styled.td`
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #cbd8d8;

  &:first-child {
    text-align: left;
    color: #e3ecec;
    font-weight: 500;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 13px;
  }
`;

export const TDGroup = styled.td`
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  color: #9fb0b0;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-align: left;

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 11px;
  }
`;

export const CellCheck = styled.td`
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  svg {
    width: 16px;
    height: 16px;
    stroke: #34d399;
    stroke-width: 3;
    fill: none;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
  }
`;

export const CellDash = styled.td`
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.22);

  @media (max-width: 480px) {
    padding: 12px 14px;
  }
`;
