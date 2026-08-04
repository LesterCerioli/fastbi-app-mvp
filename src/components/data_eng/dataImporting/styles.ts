import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 48px;
  animation: ${fadeInUp} 0.6s ease-out 0.15s backwards;
`;

export const Card = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 180px;
  height: 180px;
  border: none;
  border-radius: 14px;
  background: #ef4444;
  color: #ffffff;
  font-family: "Inter", system-ui, sans-serif;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.30);
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.75;
    cursor: wait;
  }
`;

export const Icon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const Label = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
`;

export const Title = styled.span`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #ffffff;
  line-height: 1.3;
`;

export const Hint = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.3;
`;

export const Spinner = styled.span`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  flex-shrink: 0;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const FileInput = styled.input`
  display: none;
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
