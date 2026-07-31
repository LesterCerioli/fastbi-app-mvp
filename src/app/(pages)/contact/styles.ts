import styled from "styled-components";

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
    radial-gradient(900px 700px at 80% 0%, rgba(34, 197, 94, 0.25), transparent 60%),
    radial-gradient(1100px 900px at 0% 100%, rgba(8, 75, 140, 0.50), transparent 55%),
    linear-gradient(135deg, #04190f 0%, #06241a 45%, #061d33 100%);
  pointer-events: none;
`;

export const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  padding-top: 120px;

  @media (max-width: 768px) {
    padding: 0 16px;
    padding-top: 100px;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 48px 0 16px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;
