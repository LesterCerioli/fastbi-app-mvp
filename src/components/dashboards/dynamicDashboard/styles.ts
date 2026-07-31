import styled, { keyframes } from "styled-components";

export const Container = styled.main`
  width: 100%;
  overflow-x: hidden;
`;

export const Hero = styled.section`
  position: relative;
  height: 100vh;
`;

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(10, 37, 64, 0.9) 0%,
    rgba(10, 37, 64, 0.5) 50%,
    rgba(10, 37, 64, 0.1) 100%
  );
`;

export const HeroContent = styled.div`
  position: absolute;
  top: 50%;
  left: 80px;
  transform: translateY(-50%);
  color: white;
  max-width: 600px;

  h1 {
    font-size: 44px;
    font-weight: 700;
    line-height: 1.2;
  }

  p {
    margin-top: 16px;
    font-size: 18px;
  }
`;

export const ButtonGroup = styled.div`
  margin-top: 24px;
  display: flex;
  gap: 16px;
`;

export const PrimaryButton = styled.button`
  background: #22c55e;
  padding: 14px 24px;
  border-radius: 8px;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: #16a34a;
  }
`;

export const SecondaryButton = styled.button`
  background: transparent;
  border: 1px solid white;
  padding: 14px 24px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
`;

/* Features Section */
export const Features = styled.section`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: -80px;
  position: relative;
  z-index: 2;
  padding: 0 20px;
`;

export const Card = styled.div`
  background: white;
  padding: 32px 24px;
  border-radius: 12px;
  width: 280px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  h3 {
    margin: 20px 0 12px;
    font-size: 20px;
    font-weight: 700;
  }

  p {
    color: #666;
    line-height: 1.5;
  }
`;

export const IconWrapper = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
`;

/* Simplifying Section */
export const SectionCenter = styled.section`
  text-align: center;
  margin: 120px 0 80px;

  h2 {
    font-size: 32px;
    font-weight: 700;
  }

  p {
    margin-top: 12px;
    color: #666;
    font-size: 18px;
  }
`;

/* Details Section */
export const Details = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  max-width: 1200px;
  margin: 0 auto 120px;
  padding: 0 20px;

  @media (max-width: 968px) {
    flex-direction: column;
    gap: 40px;
  }
`;

export const IllustrationWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;

  img {
    max-width: 100%;
    height: auto;
  }
`;

export const BenefitsList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const BenefitCard = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  padding: 24px 32px;
  border-radius: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px rgba(249, 115, 22, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 20px 24px;
    gap: 16px;
  }
`;

export const BenefitIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 10px;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

export const BenefitContent = styled.div`
  flex: 1;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    
    @media (max-width: 768px) {
      font-size: 1.1rem;
    }
  }
  
  p {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
    
    @media (max-width: 768px) {
      font-size: 0.85rem;
    }
  }
`;

export const BenefitItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  svg {
    flex-shrink: 0;
    margin-top: 4px;
  }

  div {
    h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    p {
      color: #666;
      line-height: 1.6;
    }
  }
`;

const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

export const CarouselSection = styled.section`
  padding: 80px 20px 60px;
  background: #f8fafc;
  text-align: center;
  overflow: hidden;
`;

export const CarouselTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
    margin-bottom: 2rem;
  }
`;

export const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  margin: 0 auto;
`;

export const CarouselTrack = styled.div`
  display: flex;
  gap: 2rem;
  animation: ${scroll} 40s linear infinite;
  width: max-content;
  
  &:hover {
    animation-play-state: paused;
  }
`;

export const DashboardCard = styled.div`
  flex: 0 0 auto;
  width: 640px;
  max-width: 90vw;
  transition: transform 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
  }
`;

export const CarouselNote = styled.p`
  margin-top: 2rem;
  color: #64748b;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
`;


export const IndustriesSection = styled.section`
  padding: 80px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  text-align: center;
`;

export const ReportsSection = styled.section`
  padding: 80px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  text-align: center;
`;

export const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

export const SectionSubtitle = styled.p`
  font-size: 1.2rem;
  color: #64748b;
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2rem;
    padding: 0 20px;
  }
`;

export const ImageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  transition: transform 0.3s ease;
  padding: 0 20px;
  
  &:hover {
    transform: scale(1.02);
  }
  
  img {
    width: 100%;
    height: auto;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 0 10px;
    
    &:hover {
      transform: scale(1.01);
    }
  }
`;

export const ReportsImageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  transition: transform 0.3s ease;
  padding: 0 20px;
  
  &:hover {
    transform: scale(1.02);
  }
  
  img {
    width: 100%;
    height: 300px; /* Altura fixa reduzida */
    object-fit: cover; /* Mantém a proporção cortando o excesso */
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 0 10px;
    
    img {
      height: 200px; /* Altura ainda menor para mobile */
    }
    
    &:hover {
      transform: scale(1.01);
    }
  }
`;
export const DashboardContainer = styled.div`
  padding: 60px 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 40px 20px;
  }
`;

export const DashboardTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: white;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

export const DashboardSubtitle = styled.p`
  text-align: center;
  color: #94a3b8;
  font-size: 1rem;
  margin-bottom: 3rem;
`;

export const FiltersCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 28px 32px;
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-end;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const FilterGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FilterLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const FilterSelect = styled.select`
  padding: 12px 16px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #22c55e;
  }
  
  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }
`;

export const FilterButton = styled.button`
  padding: 12px 32px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 44px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const DashboardStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

export const DashboardStatCard = styled.div<{ color: string }>`
  background: linear-gradient(135deg, ${({ color }) => color}, ${({ color }) => color}dd);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

export const DashboardStatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
`;

export const DashboardStatLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const DashboardSectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ChartContainer = styled.div`
  width: 100%;
  height: 320px;
  margin-top: 16px;
`;

export const BusinessDistribution = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const PieChartWrapper = styled.div`
  width: 250px;
  height: 250px;
`;

export const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #cbd5e1;
  font-size: 0.9rem;
`;

export const LegendColor = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${({ color }) => color};
`;

export const LegendPercentage = styled.span`
  color: white;
  font-weight: 600;
  margin-left: auto;
`;

export const BarChartWrapper = styled.div`
  width: 100%;
  height: 300px;
  margin-top: 20px;
`;