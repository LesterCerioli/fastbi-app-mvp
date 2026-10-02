import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #0A0F1F;
  color: #FFFFFF;
  padding-top: 140px;

  @media (max-width: 1024px) {
    padding-top: 130px;
  }

  @media (max-width: 768px) {
    padding-top: 110px;
  }

  @media (max-width: 640px) {
    padding-top: 100px;
  }
`;

export const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 32px;
`;

export const MainTitle = styled.h1`
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 24px;
  color: #FFFFFF;
  letter-spacing: -2px;
  text-align: center;
  width: 100%;
  
  @media (max-width: 768px) {
    font-size: 48px;
  }
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
`;

export const Greeting = styled.div`
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }
`;

export const UserWelcome = styled.p`
  font-size: 16px;
  color: #94A3B8;
  margin: 0;
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94A3B8;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #FFFFFF;
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
`;

export const StatCard = styled.div`
  background: rgba(17, 34, 61, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);
  }
`;

export const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0A0F1F;
`;

export const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StatValue = styled.span`
  font-size: 22px;
  font-weight: 700;
`;

export const StatLabel = styled.span`
  font-size: 13px;
  color: #94A3B8;
  margin-top: 4px;
`;

export const NavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

export const NavCard = styled.button`
  background: rgba(17, 34, 61, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  color: inherit;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);
  }
`;

export const NavCardContent = styled.div`
  flex: 1;
`;

export const NavCardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
`;

export const NavCardDesc = styled.p`
  font-size: 14px;
  color: #94A3B8;
`;
