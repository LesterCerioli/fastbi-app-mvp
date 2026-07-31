import styled from "styled-components";

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: #020617;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 120px 24px;
`;

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.button`
  background: #f97316;
  border: none;
  border-radius: 16px;
  padding: 48px 24px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);

  &:hover {
    background: #ea580c;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const BackButton = styled.button`
  background: transparent;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;

  &:hover {
    background: #1e293b;
    color: #f1f5f9;
  }
`;

export const Placeholder = styled.div`
  text-align: center;
  padding: 80px 24px;
  color: #64748b;
  font-size: 18px;
`;
