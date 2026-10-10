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
const scrollBackAndForth = keyframes`
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
`;

export const Features = styled.section`
  margin-top: -80px;
  position: relative;
  z-index: 2;
  padding: 0 20px;
  overflow: hidden;
  max-width: 928px;
  margin-left: auto;
  margin-right: auto;
`;

export const FeaturesTrack = styled.div`
  display: flex;
  gap: 24px;
  width: max-content;
  animation: ${scrollBackAndForth} 20s ease-in-out infinite;

  &:hover {
    animation-play-state: paused;
  }
`;

export const Card = styled.div`
  background: white;
  padding: 32px 24px;
  border-radius: 12px;
  width: 280px;
  flex: 0 0 auto;
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
  color: white;

  @media (prefers-color-scheme: light) {
    color: black;
  }

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
  color: white;

  @media (prefers-color-scheme: light) {
    color: black;
  }

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

export const DashboardBanner = styled.button`
  position: fixed;
  top: 100px;
  right: 24px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
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