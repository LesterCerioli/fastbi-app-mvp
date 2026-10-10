import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Wrapper = styled.div`
  flex: 1;
  min-width: 240px;
  max-width: 300px;
  animation: ${fadeInUp} 0.5s ease-out;
`;

export const Card = styled.button`
  width: 100%;
  height: 220px;
  background: linear-gradient(145deg, #0a2a1f 0%, #0d1f2e 100%);
  border: 1px solid #1a3a3a;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, background 0.2s;
  text-align: center;

  &:hover {
    border-color: #22c55e;
    box-shadow: 0 16px 40px rgba(34, 197, 94, 0.25), 0 0 0 1px #22c55e;
    transform: translateY(-4px);
    background: linear-gradient(145deg, #0d3a2a 0%, #112a3e 100%);
  }

  &:focus-visible {
    outline: 2px solid #22c55e;
    outline-offset: 3px;
  }

  @media (max-width: 768px) {
    height: 200px;
    padding: 24px 20px;
  }
`;

export const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #bbf7d0;
  flex-shrink: 0;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

export const Title = styled.span`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: #ffffff;
  letter-spacing: -0.2px;
  line-height: 1.2;
`;

export const Description = styled.span`
  font-size: 13px;
  color: #6b8a8a;
  line-height: 1.4;
  max-width: 220px;
`;