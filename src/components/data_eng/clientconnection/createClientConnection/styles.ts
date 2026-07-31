import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
`;

export const Card = styled.form`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  backdrop-filter: blur(12px);

  @media (max-width: 600px) {
    padding: 24px 20px;
    gap: 18px;
  }
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
`;

export const Title = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #ffffff;
  letter-spacing: -0.3px;
`;

export const Subtitle = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #8ba3a8;
  line-height: 1.5;
`;

export const Divider = styled.div`
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
`;

export const SectionTitle = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #6b8388;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #c7d4d4;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const Required = styled.span`
  color: #ef4444;
  font-size: 14px;
`;

export const Input = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 13px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
  }

  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #1a2a2e inset;
    -webkit-text-fill-color: #ffffff;
  }
`;

export const Select = styled.select`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 13px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b8388' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;

  &:focus {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
  }

  option {
    background: #1a2a2e;
    color: #ffffff;
  }
`;

export const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 13px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
  min-height: 100px;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
  }
`;

export const Hint = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #6b8388;
  line-height: 1.4;
`;

export const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

export const Button = styled.button<{ $variant?: "primary" | "secondary" | "ghost" }>`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 13px 28px;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: ${({ $variant }) => ($variant === "ghost" ? "0" : "1")};

  background: ${({ $variant }) =>
    $variant === "secondary"
      ? "rgba(255, 255, 255, 0.08)"
      : $variant === "ghost"
      ? "transparent"
      : "linear-gradient(90deg, #22c55e, #34d399)"};

  color: ${({ $variant }) =>
    $variant === "primary" ? "#04210f" : "#ffffff"};

  box-shadow: ${({ $variant }) =>
    $variant === "primary"
      ? "0 8px 24px rgba(34, 197, 94, 0.28)"
      : "none"};

  border: ${({ $variant }) =>
    $variant === "ghost" ? "1px solid rgba(255, 255, 255, 0.10)" : "none"};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({ $variant }) =>
      $variant === "primary"
        ? "0 12px 30px rgba(34, 197, 94, 0.40)"
        : $variant === "secondary"
        ? "0 4px 16px rgba(255, 255, 255, 0.06)"
        : "0 4px 16px rgba(255, 255, 255, 0.06)"};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Message = styled.div<{ $type: "success" | "error" }>`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;

  background: ${({ $type }) =>
    $type === "success"
      ? "rgba(52, 211, 153, 0.12)"
      : "rgba(239, 68, 68, 0.12)"};

  color: ${({ $type }) =>
    $type === "success" ? "#34d399" : "#ef4444"};

  border: 1px solid ${({ $type }) =>
    $type === "success"
      ? "rgba(52, 211, 153, 0.20)"
      : "rgba(239, 68, 68, 0.20)"};
`;

export const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: ${({ color }) => color || "#ffffff"};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
