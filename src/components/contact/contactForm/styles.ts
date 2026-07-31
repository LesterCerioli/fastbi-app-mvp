import styled from "styled-components";

export const Form = styled.form`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 480px) {
    padding: 24px 20px;
    gap: 16px;
  }
`;

export const FormTitle = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 22px;
  color: #ffffff;
  margin-bottom: 4px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #c7d4d4;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 14px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 14px;
  }
`;

export const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 14px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
  min-height: 140px;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 14px;
    min-height: 120px;
  }
`;

export const SubmitButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  border-radius: 10px;
  padding: 14px 28px;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  background: linear-gradient(90deg, #22c55e, #34d399);
  color: #04210f;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.28);
  margin-top: 4px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(34, 197, 94, 0.40);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 480px) {
    padding: 12px 24px;
    font-size: 14px;
  }
`;
