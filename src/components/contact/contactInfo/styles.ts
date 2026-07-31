import styled from "styled-components";

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Card = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  padding: 28px 28px;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.20);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    padding: 22px 20px;
  }
`;

export const CardTitle = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: #34d399;
    flex-shrink: 0;
  }
`;

export const CardText = styled.p`
  color: #9db3b8;
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
`;

export const CardLink = styled.a`
  color: #e2eced;
  font-size: 15px;
  line-height: 1.8;
  text-decoration: none;
  display: block;
  transition: color 0.2s;

  &:hover {
    color: #34d399;
  }
`;

export const SocialRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

export const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: #c7d4d4;
  transition: all 0.2s;

  &:hover {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.30);
    color: #34d399;
    transform: translateY(-2px);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;
