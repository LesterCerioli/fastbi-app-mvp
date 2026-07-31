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

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 8px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const Plus = styled.span`
  color: #34d399;
  font-size: 22px;
  transition: transform 0.2s;
  flex: 0 0 auto;
`;

export const Item = styled.details`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  padding: 4px 22px;

  @media (max-width: 480px) {
    padding: 4px 16px;
  }

  &[open] ${Plus} {
    transform: rotate(45deg);
  }
`;

export const Summary = styled.summary`
  cursor: pointer;
  list-style: none;
  font-weight: 600;
  font-size: 16px;
  padding: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  color: #ffffff;

  &::-webkit-details-marker {
    display: none;
  }

  @media (max-width: 480px) {
    font-size: 14.5px;
    padding: 16px 0;
    gap: 12px;
  }
`;

export const Answer = styled.p`
  color: #9db3b8;
  font-size: 14.5px;
  padding: 0 0 20px;
  line-height: 1.6;
  margin: 0;
`;
