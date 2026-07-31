import styled from "styled-components";

export const Hero = styled.header`
  text-align: center;
  padding: 40px 0 16px;

  @media (max-width: 480px) {
    padding: 24px 0 8px;
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
  font-size: clamp(36px, 5vw, 56px);
  margin: 20px 0 14px;
  color: #ffffff;

  @media (max-width: 480px) {
    font-size: clamp(28px, 7vw, 36px);
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
  font-size: clamp(15px, 1.4vw, 18px);
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.6;
`;
