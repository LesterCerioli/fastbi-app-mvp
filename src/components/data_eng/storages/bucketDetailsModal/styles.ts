import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
`;

export const Modal = styled.div`
  background: #0d1f1a;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  padding: 28px 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 480px) {
    padding: 20px 16px;
    gap: 12px;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const Title = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #ffffff;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #9db3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
  }
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #c7d4d4;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 12px 14px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
  }
`;

export const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 12px 14px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #ffffff;
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
  }
`;

export const FileInput = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 10px 12px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #ffffff;
  outline: none;
  cursor: pointer;

  &::file-selector-button {
    background: #22c55e;
    border-radius: 6px;
    padding: 6px 12px;
    font-family: "Inter", system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #04210f;
    border: none;
    margin-right: 8px;
    transition: background 0.2s;
    cursor: pointer;
  }

  &::file-selector-button:hover {
    background: #34d399;
  }

  &:focus {
    border-color: #34d399;
  }
`;

export const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 4px 0;
`;

export const PrimaryButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  background: linear-gradient(90deg, #22c55e, #34d399);
  color: #04210f;
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.25);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(34, 197, 94, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const SecondaryButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: transparent;
  color: #ffffff;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: #9db3b8;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const DangerButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.10);
  color: #f87171;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;

  &:hover {
    background: rgba(239, 68, 68, 0.20);
    border-color: #ef4444;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const ConfirmBox = styled.div`
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ConfirmText = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #fecaca;
  margin: 0;
`;

export const StatusTag = styled.div<{ $variant: "success" | "error" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;

  ${({ $variant }) =>
    $variant === "success"
      ? `
        background: rgba(34, 197, 94, 0.12);
        border-color: rgba(34, 197, 94, 0.45);
        color: #34d399;
      `
      : `
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.45);
        color: #f87171;
      `}
`;