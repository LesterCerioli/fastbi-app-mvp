import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 0 auto 24px auto;
`;

export const Card = styled.button`
  width: 240px;
  height: 240px;
  background: #f97316;
  border: 1px solid #fb923c;
  border-radius: 0;
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;

  &:hover {
    background: #fb923c;
    box-shadow: 0 12px 30px rgba(249, 115, 22, 0.40);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 3px;
  }
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

export const Title = styled.span`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 32px;
  color: #ffffff;
  letter-spacing: -0.3px;
  text-align: center;
`;
