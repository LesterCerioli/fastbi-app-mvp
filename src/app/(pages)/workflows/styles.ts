import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #0A0F1F;
  color: #FFFFFF;
  padding-top: 140px;

  @media (max-width: 1024px) {
    padding-top: 130px;
  }

  @media (max-width: 768px) {
    padding-top: 110px;
  }

  @media (max-width: 640px) {
    padding-top: 100px;
  }
`;

export const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 32px;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

export const Button = styled.button`
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00D4FF;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 212, 255, 0.25);
  }
`;

export const DangerButton = styled.button`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }
`;

export const SuccessButton = styled.button`
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(34, 197, 94, 0.25);
  }
`;

export const Select = styled.select`
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 14px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  cursor: pointer;
`;

export const Input = styled.input`
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 14px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: #22c55e;
  }
`;

export const Toast = styled.div<{ $type: "success" | "error" | "info" }>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  background: ${({ $type }) =>
    $type === "success" ? "rgba(34, 197, 94, 0.15)" : $type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(0, 212, 255, 0.15)"};
  border: 1px solid ${({ $type }) =>
    $type === "success" ? "rgba(34, 197, 94, 0.3)" : $type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(0, 212, 255, 0.3)"};
  color: ${({ $type }) =>
    $type === "success" ? "#22c55e" : $type === "error" ? "#ef4444" : "#00D4FF"};
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 31, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  font-size: 16px;
  color: #94a3b8;
`;