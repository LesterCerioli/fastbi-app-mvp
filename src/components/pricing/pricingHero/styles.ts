import styled from "styled-components";

export const Hero = styled.header`
  text-align: center;
  padding: 88px 0 36px;

  @media (max-width: 768px) {
    padding: 48px 0 24px;
  }

  @media (max-width: 480px) {
    padding: 32px 0 20px;
  }
`;

export const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #bfe8d4;
  background: rgba(34, 197, 94, 0.10);
  border: 1px solid rgba(34, 197, 94, 0.30);
  padding: 7px 16px;
  border-radius: 999px;
  letter-spacing: 0.3px;
`;

export const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px #34d399;
`;

export const Title = styled.h1`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -1px;
  font-size: clamp(32px, 6vw, 68px);
  margin: 24px 0 18px;
  color: #ffffff;

  @media (max-width: 480px) {
    font-size: clamp(28px, 8vw, 36px);
    margin: 16px 0 12px;
  }
`;

export const Grad = styled.span`
  background: linear-gradient(100deg, #34d399, #22d3ee);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

export const Lede = styled.p`
  color: #9db3b8;
  font-size: clamp(16px, 1.6vw, 19px);
  max-width: 600px;
  margin: 0 auto 34px;
  line-height: 1.6;
`;

export const ToggleWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
  }
`;

export const Toggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  padding: 6px;
  position: relative;
`;

export const ToggleBtn = styled.button<{ $on?: boolean }>`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: ${({ $on }) => $on ? "#04210f" : "#c7d4d4"};
  background: transparent;
  border: 0;
  border-radius: 999px;
  padding: 9px 20px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  transition: color 0.25s;
`;

export const Slider = styled.span<{ $annual?: boolean }>`
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 6px;
  width: calc(50% - 6px);
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #34d399);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  transform: ${({ $annual }) => $annual ? "translateX(100%)" : "translateX(0)"};
`;

export const SaveTag = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 5px 11px;
  border-radius: 999px;
  margin-left: 6px;
`;
