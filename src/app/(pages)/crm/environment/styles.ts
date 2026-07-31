import styled, { keyframes } from "styled-components";

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

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
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

export const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`;

export const HeroSection = styled.div`
  position: relative;
  padding: 80px 40px 60px;
  text-align: center;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.9) 100%);
  border-bottom: 1px solid rgba(34, 197, 94, 0.2);
  
  @media (max-width: 768px) {
    padding: 60px 20px 40px;
  }
`;

export const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff, #22c55e, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 0.8s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

export const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto;
  animation: ${fadeInUp} 0.8s ease-out 0.2s backwards;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const DashboardWrapper = styled.div`
  animation: ${fadeInUp} 0.6s ease-out;
`;

export const FloatingCard = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  
  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
  }
`;

export const FloatingButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite;
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4);
  }
  
  svg {
    width: 28px;
    height: 28px;
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

export const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

export const StatItem = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(34, 197, 94, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`;

export const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #22c55e;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 20px;
`;

export const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(34, 197, 94, 0.2);
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 12px;
  padding: 16px 24px;
  color: #fecaca;
  text-align: center;
  margin: 20px 0;
`;

export const RefreshButton = styled.button`
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 8px 16px;
  color: #22c55e;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  
  &:hover {
    background: rgba(34, 197, 94, 0.3);
    transform: translateY(-2px);
  }
`;

export const Footer = styled.footer`
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 40px;
`;