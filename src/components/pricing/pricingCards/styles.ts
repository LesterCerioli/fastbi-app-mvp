import styled, { keyframes, css } from "styled-components";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

export const Tiers = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 48px 0 16px;
  align-items: stretch;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    max-width: 440px;
    margin: 32px auto 0;
  }
`;

export const Card = styled.div<{ $featured?: boolean }>`
  position: relative;
  background: ${({ $featured }) =>
    $featured ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.04)"};
  border: 1px solid
    ${({ $featured }) =>
      $featured ? "rgba(52, 211, 153, 0.45)" : "rgba(255, 255, 255, 0.10)"};
  border-radius: 18px;
  padding: 34px 30px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s, background 0.2s;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.22);
  }

  @media (max-width: 480px) {
    padding: 24px 20px;
  }

  ${({ $featured }) =>
    $featured &&
    css`
    &::before {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 20px;
      background: linear-gradient(140deg, rgba(52, 211, 153, 0.5), rgba(34, 211, 238, 0.35));
      filter: blur(22px);
      opacity: 0.55;
      z-index: -1;
      animation: ${pulse} 5s ease-in-out infinite;
    }
  `}
`;

export const BadgePop = styled.span`
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #04210f;
  background: linear-gradient(90deg, #22c55e, #34d399);
  padding: 6px 16px;
  border-radius: 999px;
  white-space: nowrap;
`;

export const TierName = styled.div`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #ffffff;
`;

export const TierDesc = styled.div`
  color: #9db3b8;
  font-size: 14px;
  margin: 8px 0 24px;
  min-height: 40px;
  line-height: 1.5;
`;

export const Price = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

export const Amt = styled.span`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 52px;
  letter-spacing: -1px;
  color: #ffffff;

  @media (max-width: 480px) {
    font-size: 40px;
  }
`;

export const Per = styled.span`
  color: #9db3b8;
  font-size: 14px;
  font-weight: 500;
`;

export const Billed = styled.div`
  color: #9db3b8;
  font-size: 13px;
  margin-top: 6px;
  min-height: 18px;
`;

export const UserLimit = styled.div`
  color: #34d399;
  font-size: 13px;
  font-weight: 600;
  margin-top: 4px;
  min-height: 16px;
`;

export const CTAButton = styled.button<{ $primary?: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14.5px;
  border-radius: 9px;
  padding: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  width: 100%;
  margin: 26px 0 26px;
  text-align: center;

  ${({ $primary }) =>
    $primary
      ? `
    background: #22c55e;
    color: #04210f;
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.28);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 30px rgba(34, 197, 94, 0.40);
    }
  `
      : `
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.10);
    color: #dfe9e9;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  `}
`;

export const FeatList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 13px;
  font-size: 14.5px;
  color: #d4e0e0;
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const FeatItem = styled.li`
  display: flex;
  gap: 11px;
  align-items: flex-start;
`;

export const Check = styled.span`
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-top: 1px;
  background: rgba(34, 197, 94, 0.16);
  display: grid;
  place-items: center;

  svg {
    width: 11px;
    height: 11px;
    stroke: #34d399;
    stroke-width: 3;
    fill: none;
  }
`;

export const Muted = styled.span`
  color: #9db3b8;
`;
