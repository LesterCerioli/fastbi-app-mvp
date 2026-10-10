import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Container = styled.main`
  width: 100%;
  min-height: 100vh;
  background: #04150d;
  color: #ffffff;
  font-family: "Inter", system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
`;

export const PageBg = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(900px 700px at 12% 0%, rgba(34, 197, 94, 0.25), transparent 60%),
    radial-gradient(1100px 900px at 100% 100%, rgba(8, 75, 140, 0.45), transparent 55%),
    linear-gradient(135deg, #04190f 0%, #06241a 45%, #061d33 100%);
  pointer-events: none;
`;

export const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  padding-top: 100px;

  @media (max-width: 768px) {
    padding: 0 16px;
    padding-top: 80px;
  }
`;

export const SectionHead = styled.div`
  margin: 24px 0 32px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9db3b8;
  font-size: 14px;
  text-decoration: none;
  margin-bottom: 16px;
  transition: color 0.2s;

  &:hover {
    color: #22c55e;
  }

  svg {
    flex-shrink: 0;
  }
`;

export const SectionTitle = styled.h1`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: -0.5px;
  color: #ffffff;
`;

export const SectionSubtitle = styled.p`
  color: #9db3b8;
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.5;
`;

export const ComingSoon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(145deg, #0a2a1f 0%, #0d1f2e 100%);
  border: 1px solid #1a3a3a;
  border-radius: 16px;
  animation: ${fadeInUp} 0.6s ease-out 0.1s backwards;
`;

export const Icon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #bbf7d0;
`;

export const Title = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 28px;
  color: #ffffff;
  margin-bottom: 12px;
`;

export const Description = styled.p`
  color: #6b8a8a;
  font-size: 16px;
  line-height: 1.6;
  max-width: 500px;
`;