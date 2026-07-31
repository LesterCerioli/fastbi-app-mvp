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
    radial-gradient(900px 700px at 12% 0%, rgba(34, 197, 94, 0.30), transparent 60%),
    radial-gradient(1100px 900px at 100% 100%, rgba(8, 75, 140, 0.55), transparent 55%),
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

export const Section = styled.section`
  padding: 56px 0;

  @media (max-width: 768px) {
    padding: 32px 0;
  }
`;

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

export const SectionSubtitle = styled.p`
  color: #9db3b8;
  margin-top: 10px;
  font-size: 16px;
`;
