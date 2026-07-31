import styled from "styled-components";

export const Final = styled.div`
  text-align: center;
  background: linear-gradient(
    120deg,
    rgba(34, 197, 94, 0.14),
    rgba(8, 75, 140, 0.22)
  );
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 24px;
  padding: 56px 32px;
  margin: 48px 0 64px;

  @media (max-width: 768px) {
    padding: 40px 24px;
    margin: 32px 0 48px;
  }

  @media (max-width: 480px) {
    padding: 32px 16px;
    border-radius: 16px;
    margin: 24px 0 32px;
  }
`;

export const Title = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(28px, 3.6vw, 40px);
  letter-spacing: -0.5px;
  color: #ffffff;
`;

export const Grad = styled.span`
  background: linear-gradient(100deg, #34d399, #22d3ee);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

export const Desc = styled.p`
  color: #9db3b8;
  margin: 14px auto 28px;
  max-width: 480px;
  font-size: 16px;
  line-height: 1.6;
`;

export const Row = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    gap: 10px;

    button {
      width: 100%;
      max-width: 280px;
    }
  }
`;

export const PrimaryButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14.5px;
  border-radius: 9px;
  padding: 12px 24px;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  background: #22c55e;
  color: #04210f;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.28);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(34, 197, 94, 0.40);
  }
`;

export const SecondaryButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14.5px;
  border-radius: 9px;
  padding: 12px 24px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  background: rgba(255, 255, 255, 0.06);
  color: #dfe9e9;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
`;
