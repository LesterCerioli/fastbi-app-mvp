import styled from "styled-components";

export const Enterprise = styled.div`
  margin: 40px 0;
  background: linear-gradient(
    120deg,
    rgba(8, 75, 140, 0.35),
    rgba(34, 197, 94, 0.12)
  );
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  padding: 40px 44px;
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;

  @media (max-width: 960px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 32px 24px;
  }

  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

export const Info = styled.div``;

export const Title = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-size: 26px;
  font-weight: 600;
  color: #ffffff;
`;

export const Desc = styled.p`
  color: #9db3b8;
  font-size: 15px;
  margin-top: 8px;
  max-width: 520px;
  line-height: 1.6;
`;

export const Stats = styled.div`
  display: flex;
  gap: 40px;
  margin-left: auto;
  flex-wrap: wrap;

  @media (max-width: 960px) {
    margin-left: 0;
    width: 100%;
  }

  @media (max-width: 480px) {
    gap: 24px;
    justify-content: space-between;
  }
`;

export const Stat = styled.div``;

export const StatNum = styled.div`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 26px;
  color: #ffffff;
`;

export const StatLabel = styled.div`
  color: #9db3b8;
  font-size: 13px;
`;

export const CTAButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14.5px;
  border-radius: 9px;
  padding: 11px 20px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  background: #22c55e;
  color: #04210f;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.28);
  margin-left: auto;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(34, 197, 94, 0.40);
  }

  @media (max-width: 960px) {
    margin-left: 0;
  }

  @media (max-width: 480px) {
    width: 100%;
    text-align: center;
  }
`;
