import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
`;

export const Card = styled.div`
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  margin: 0 0 28px;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FullRow = styled.div`
  grid-column: 1 / -1;
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
  display: flex;
  align-items: center;
  gap: 4px;
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
  transition: border-color 0.2s;
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

export const TextArea = styled.textarea`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
  min-height: 100px;
  font-family: "Menlo", "Monaco", monospace;

  &:focus {
    border-color: #22c55e;
  }

  &::placeholder {
    color: #475569;
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
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

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 20px;
`;

export const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #86efac;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
`;

export const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 8px;
  margin-bottom: 4px;
`;
