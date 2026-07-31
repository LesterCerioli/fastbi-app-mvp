import styled from "styled-components";

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: #020617;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 24px 48px;
`;

export const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #f1f5f9;
`;

export const Subtitle = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 32px;
`;

export const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  margin: 32px 0;
  gap: 16px;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #1e293b;
  }
`;

export const CustomButton = styled.button`
  width: 100%;
  background: transparent;
  border: 2px dashed #334155;
  border-radius: 12px;
  padding: 32px;
  color: #94a3b8;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #22c55e;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.05);
  }
`;

export const BackButton = styled.button`
  background: transparent;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;

  &:hover {
    background: #1e293b;
    color: #f1f5f9;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
`;

export const Required = styled.span`
  color: #ef4444;
`;

export const Input = styled.input`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const Select = styled.select`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 10px center;
  background-repeat: no-repeat;
  padding-right: 32px;

  &:focus {
    border-color: #22c55e;
  }

  option {
    background: #1e293b;
    color: #f1f5f9;
  }
`;

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
`;

export const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #86efac;
  font-size: 13px;
  text-align: center;
`;

export const DesignerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DesignerLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #1e293b;
`;

export const Button = styled.button<{ $variant?: "primary" | "ghost" }>`
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant = "primary" }) =>
    $variant === "primary"
      ? `
    background: #22c55e;
    color: white;
    &:hover { background: #16a34a; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `
      : `
    background: transparent;
    color: #94a3b8;
    &:hover { background: #1e293b; color: #f1f5f9; }
  `}
`;
