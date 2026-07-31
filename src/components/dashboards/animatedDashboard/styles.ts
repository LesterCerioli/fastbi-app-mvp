import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 8px var(--card-glow); }
  50% { box-shadow: 0 0 24px var(--card-glow); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const numberSlide = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rain = keyframes`
  0% { transform: translateY(-10px); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(10px); opacity: 0; }
`;

export const Section = styled.section`
  padding: 80px 120px;
  position: relative;
  overflow: hidden;

  @media (max-width: 1024px) {
    padding: 40px 20px;
  }
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
  animation: ${fadeInUp} 0.8s ease-out;

  h2 {
    font-size: 36px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(90deg, #22c55e, #38bdf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: 16px;
    color: #94a3b8;
    margin-top: 8px;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div<{ $delay: number; $color: string }>`
  background: ${({ $color }) => `linear-gradient(135deg, ${$color}18, ${$color}08)`};
  border: 1px solid ${({ $color }) => `${$color}33`};
  border-radius: 16px;
  padding: 24px;
  --card-glow: ${({ $color }) => `${$color}44`};
  animation: ${fadeInUp} 0.6s ease-out ${({ $delay }) => $delay}s both, ${glow} 3s ease-in-out infinite ${({ $delay }) => $delay + 1}s;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      ${({ $color }) => `${$color}11`},
      transparent
    );
    background-size: 200% 100%;
    animation: ${shimmer} 4s ease-in-out infinite;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 48px ${({ $color }) => `${$color}33`};
  }
`;

export const CardIcon = styled.div<{ $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${({ $color }) => `${$color}22`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 12px;
  animation: ${float} 3s ease-in-out infinite;
`;

export const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  position: relative;
  z-index: 1;
`;

export const CardSub = styled.span`
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
`;

export const BarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
`;

export const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const BarLabel = styled.span`
  font-size: 11px;
  color: #94a3b8;
  width: 36px;
  flex-shrink: 0;
`;

export const BarTrack = styled.div`
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  overflow: hidden;
`;

export const BarFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: linear-gradient(90deg, ${({ $color }) => $color}, ${({ $color }) => `${$color}88`});
  border-radius: 5px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 1px;
    width: 4px;
    height: 8px;
    background: white;
    border-radius: 2px;
    opacity: 0.5;
  }
`;

export const BarValue = styled.span`
  font-size: 11px;
  font-weight: 700;
  width: 30px;
  text-align: right;
  flex-shrink: 0;
  animation: ${numberSlide} 0.3s ease-out;
`;

export const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;

  &:last-child { border-bottom: none; }
`;

export const StatLabel = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

export const StatValue = styled.span<{ $color: string }>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  animation: ${numberSlide} 0.3s ease-out;
`;

export const PulseDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  animation: ${pulse} 1.8s ease-in-out infinite;
  display: inline-block;
  margin-right: 8px;
  flex-shrink: 0;
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
  padding: 5px 0;
  position: relative;
  z-index: 1;
`;

export const Spinner = styled.div<{ $color: string }>`
  width: 14px;
  height: 14px;
  border: 2px solid ${({ $color }) => `${$color}33`};
  border-top-color: ${({ $color }) => $color};
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
  display: inline-block;
  margin-right: 8px;
  flex-shrink: 0;
`;

export const MiniChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 32px;
  margin-top: 10px;
  position: relative;
  z-index: 1;
`;

export const MiniBar = styled.div<{ $h: number; $color: string; $i: number }>`
  width: 8px;
  height: ${({ $h }) => $h}%;
  background: ${({ $color }) => $color};
  border-radius: 2px 2px 0 0;
  animation: ${fadeInUp} 0.4s ease-out ${({ $i }) => $i * 0.05}s both;
  transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

export const LoadingOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.5);
  backdrop-filter: blur(2px);
  border-radius: 16px;
  display: ${({ $visible }) => ($visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 10;
  animation: ${fadeInUp} 0.2s ease-out;
`;

export const Tick = styled.div<{ $color: string; $delay: number }>`
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  position: absolute;
  top: ${() => Math.random() * 100}%;
  left: ${() => Math.random() * 100}%;
  animation: ${rain} 2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

export const RotatingIcon = styled.div<{ $color: string }>`
  animation: ${spin} 4s linear infinite;
  display: inline-flex;
  margin-right: 6px;
  color: ${({ $color }) => $color};
`;

export const ValueWithChange = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ChangeBadge = styled.span<{ $up: boolean }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${({ $up }) => ($up ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)")};
  color: ${({ $up }) => ($up ? "#22c55e" : "#ef4444")};
`;

export const DualRow = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;
`;
