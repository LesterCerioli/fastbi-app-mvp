import styled, { keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #0A0F1F;
  position: relative;
  overflow-x: hidden;
`;

export const DashboardWrapper = styled.div`
  position: relative;
  min-height: calc(100vh - 70px);
  padding-top: 80px;
`;

export const BackgroundGradient = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 255, 159, 0.05) 0%, transparent 50%),
    linear-gradient(135deg, #0A0F1F 0%, #0F172A 100%);
  pointer-events: none;
  z-index: 0;
`;

export const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  
  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

export const HeroSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 48px;
  flex-wrap: wrap;
  gap: 32px;
  
  @media (max-width: 968px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const HeroContent = styled.div`
  flex: 1;
  animation: ${fadeInUp} 0.6s ease-out;
`;

export const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 212, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  color: #00D4FF;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

export const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #E0F2FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

export const HeroHighlight = styled.span`
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const HeroDescription = styled.p`
  font-size: 18px;
  color: #94A3B8;
  line-height: 1.6;
  max-width: 600px;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const HeroStats = styled.div`
  display: flex;
  gap: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.2s backwards;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

export const StatCard = styled.div`
  background: rgba(17, 34, 61, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(0, 212, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);
  }
`;

export const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0A0F1F;
`;

export const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1;
`;

export const StatLabel = styled.div`
  font-size: 12px;
  color: #94A3B8;
  margin-top: 4px;
`;

export const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ViewToggle = styled.div`
  display: flex;
  gap: 12px;
  background: rgba(17, 34, 61, 0.6);
  backdrop-filter: blur(10px);
  padding: 6px;
  border-radius: 48px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ToggleButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: ${({ active }) => active ? 'linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%)' : 'transparent'};
  color: ${({ active }) => active ? '#0A0F1F' : '#94A3B8'};
  
  &:hover {
    transform: translateY(-2px);
    background: ${({ active }) => active ? 'linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%)' : 'rgba(0, 212, 255, 0.1)'};
    color: ${({ active }) => active ? '#0A0F1F' : '#FFFFFF'};
  }
`;

export const ActionsGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

export const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(17, 34, 61, 0.6);
  border-radius: 40px;
  font-size: 13px;
  color: #94A3B8;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ActionButton = styled.button<{ variant?: 'primary' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${({ variant }) => variant === 'primary' 
    ? 'linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%)' 
    : 'rgba(17, 34, 61, 0.6)'};
  color: ${({ variant }) => variant === 'primary' ? '#0A0F1F' : '#94A3B8'};
  
  &:hover {
    transform: translateY(-2px);
    background: ${({ variant }) => variant === 'primary' 
      ? 'linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%)' 
      : 'rgba(0, 212, 255, 0.2)'};
    color: #FFFFFF;
    border-color: rgba(0, 212, 255, 0.3);
  }
`;

export const DashboardContainer = styled.div`
  margin-bottom: 48px;
`;

export const DashboardCard = styled.div<{ animate?: boolean }>`
  animation: ${({ animate }) => animate ? fadeInUp : 'none'} 0.5s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

export const InsightsSection = styled.section`
  margin-top: 48px;
  padding: 48px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const InsightsHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

export const InsightsTitle = styled.h2`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #FFFFFF 0%, #E0F2FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  svg {
    -webkit-text-fill-color: initial;
    color: #00D4FF;
  }
`;

export const InsightsSubtitle = styled.p`
  font-size: 16px;
  color: #94A3B8;
`;

export const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const InsightCard = styled.div`
  background: rgba(17, 34, 61, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);
  }
`;

export const InsightIcon = styled.div`
  font-size: 32px;
`;

export const InsightContent = styled.div`
  flex: 1;
`;

export const InsightCardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #FFFFFF;
`;

export const InsightText = styled.p`
  font-size: 14px;
  color: #94A3B8;
  line-height: 1.5;
  margin-bottom: 12px;
`;

export const InsightConfidence = styled.div<{ confidence: number }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ confidence }) => 
    confidence >= 90 ? '#00FF9F' : 
    confidence >= 80 ? '#FF9F00' : '#FF4D4D'
  };
  display: inline-block;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
`;