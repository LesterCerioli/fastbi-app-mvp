import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 30%, #1dbf73, transparent 40%),
    radial-gradient(circle at 80% 20%, #0ea5e9, transparent 40%),
    #020617;
  color: white;
`;

export const HeroSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80px 120px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 40px;
    padding: 40px 20px;
  }
`;

export const Left = styled.div`
  max-width: 600px;
`;

export const Badge = styled.div`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  font-size: 56px;
  font-weight: 700;
  line-height: 1.2;

  span {
    display: block;
    background: linear-gradient(90deg, #22c55e, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

export const Description = styled.p`
  margin-top: 20px;
  color: #cbd5f5;
  line-height: 1.6;
`;

export const Actions = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 30px;
`;

export const PrimaryButton = styled.button`
  background: #22c55e;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
`;

export const SecondaryButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
`;

export const Stats = styled.div`
  display: flex;
  gap: 40px;
  margin-top: 40px;

  div {
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 22px;
  }

  span {
    font-size: 12px;
    color: #94a3b8;
  }
`;

export const Right = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

export const ImageWrapper = styled.div`
  position: relative;
  width: 500px;
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

export const DashboardSection = styled.section`
  display: flex;
  justify-content: center;
  padding: 60px 120px 100px;

  @media (max-width: 1024px) {
    padding: 40px 20px 80px;
  }
`;

export const DashboardCard = styled.div`
  background: linear-gradient(135deg, #1dbf73, #0ea5e9);
  border-radius: 16px;
  padding: 48px 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 900px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    padding: 32px 24px;
    text-align: center;
  }
`;

export const DashboardCardText = styled.div`
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin-top: 6px;
  }
`;

export const DashboardCardArrow = styled.div`
  font-size: 28px;
  font-weight: 700;
  transition: transform 0.3s ease;

  ${DashboardCard}:hover & {
    transform: translateX(6px);
  }
`;