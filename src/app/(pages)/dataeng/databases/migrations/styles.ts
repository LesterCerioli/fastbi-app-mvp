import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

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
    radial-gradient(900px 700px at 12% 0%, rgba(34, 197, 94, 0.25), transparent 60%),
    radial-gradient(1100px 900px at 100% 100%, rgba(8, 75, 140, 0.45), transparent 55%),
    linear-gradient(135deg, #04190f 0%, #06241a 45%, #061d33 100%);
  pointer-events: none;
`;

export const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  padding-top: 100px;

  @media (max-width: 768px) {
    padding: 0 16px;
    padding-top: 80px;
  }
`;

export const SectionHead = styled.div`
  margin: 24px 0 32px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9db3b8;
  font-size: 14px;
  text-decoration: none;
  margin-bottom: 16px;
  transition: color 0.2s;

  &:hover {
    color: #22c55e;
  }

  svg {
    flex-shrink: 0;
  }
`;

export const SectionTitle = styled.h1`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: -0.5px;
  color: #ffffff;
`;

export const SectionSubtitle = styled.p`
  color: #9db3b8;
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.5;
`;

export const Card = styled.div`
  background: linear-gradient(145deg, #0a2a1f 0%, #0d1f2e 100%);
  border: 1px solid #1a3a3a;
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
  animation: ${fadeInUp} 0.5s ease-out;
`;

export const CardHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #1a3a3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

export const CardTitle = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: #ffffff;
`;

export const CardContent = styled.div`
  padding: 24px;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
`;

export const Select = styled.select`
  background: #0a1a2a;
  border: 1px solid #1e3a4a;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const OptionsRow = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.15);
  border-radius: 10px;
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #e2e8f0;
    cursor: pointer;

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #22c55e;
    }
  }
`;

export const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #f87171;
  font-size: 14px;
  margin-bottom: 16px;
`;

export const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #4ade80;
  font-size: 14px;
  margin-bottom: 16px;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;

  ${p => p.$variant === 'secondary' ? `
    background: transparent;
    color: #e2e8f0;
    border: 1px solid #1e3a4a;

    &:hover:not(:disabled) {
      background: rgba(34, 197, 94, 0.1);
      border-color: #22c55e;
      color: #22c55e;
    }
  ` : p.$variant === 'ghost' ? `
    background: transparent;
    color: #9db3b8;
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      color: #22c55e;
    }
  ` : `
    background: #22c55e;
    color: #04150d;

    &:hover:not(:disabled) {
      background: #16a34a;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

export const StatusFilter = styled.div`
  select {
    background: #0a1a2a;
    border: 1px solid #1e3a4a;
    border-radius: 8px;
    padding: 8px 12px;
    color: #ffffff;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #22c55e;
    }
  }
`;

export const MigrationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #1a3a3a;
  }

  th {
    background: rgba(34, 197, 94, 0.05);
    font-weight: 600;
    color: #9db3b8;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tr:hover td {
    background: rgba(34, 197, 94, 0.03);
  }

  .migration-path {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .source { font-weight: 500; color: #e2e8f0; }
  .target { font-weight: 500; color: #60a5fa; }
  .arrow { color: #4b5563; }

  .dbms-pair {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .source-dbms { color: #9db3b8; }
`;

export const MigrationTableWrapper = styled.div`
  overflow-x: auto;
`;

export const StatusBadge = styled.span<{ $bg: string; $text: string; $border: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${p => p.$bg};
  color: ${p => p.$text};
  border: 1px solid ${p => p.$border};
`;

export const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  background: #0a1a2a;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #1e3a4a;
  min-width: 120px;
`;

export const ProgressFill = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 8px;
  transition: width 0.3s ease;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

export const SmallButton = styled.button<{ $variant?: 'ghost' | 'danger' }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;

  ${p => p.$variant === 'danger' ? `
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover {
      background: rgba(239, 68, 68, 0.3);
    }
  ` : p.$variant === 'ghost' ? `
    background: transparent;
    color: #9db3b8;
    border: 1px solid #1e3a4a;

    &:hover {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      border-color: #22c55e;
    }
  ` : `
    background: #22c55e;
    color: #04150d;

    &:hover {
      background: #16a34a;
    }
  `}
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  background: linear-gradient(145deg, #0a2a1f 0%, #0d1f2e 100%);
  border: 1px solid #1a3a3a;
  border-radius: 16px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

export const EmptyText = styled.p`
  color: #6b8a8a;
  font-size: 16px;
`;

export const OrgInputInline = styled.input`
  margin-top: 16px;
  padding: 12px 16px;
  background: #0a1a2a;
  border: 1px solid #1e3a4a;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  max-width: 300px;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }
`;

export const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
`;

export const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #1a3a3a;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const LoadingText = styled.p`
  color: #6b8a8a;
  font-size: 14px;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeInUp} 0.2s ease-out;
`;

export const Modal = styled.div`
  background: linear-gradient(145deg, #0a2a1f 0%, #0d1f2e 100%);
  border: 1px solid #1a3a3a;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${fadeInUp} 0.3s ease-out;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #1a3a3a;
`;

export const ModalTitle = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #ffffff;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #9db3b8;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 0 8px;

  &:hover {
    color: #22c55e;
  }
`;

export const ModalContent = styled.div`
  padding: 24px;
`;

export const DetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid #1a3a3a;

  &:last-child {
    border-bottom: none;
  }
`;

export const DetailLabel = styled.span`
  font-size: 12px;
  color: #6b8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const DetailValue = styled.span<{ style?: React.CSSProperties }>`
  font-size: 14px;
  color: #e2e8f0;
  word-break: break-all;
`;

export const SelectedConnection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #4ade80;
`;

export const CheckIcon = styled.span`
  font-size: 16px;
  color: #22c55e;
`;

export const ClearButton = styled.button`
  margin-left: auto;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #4ade80;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(34, 197, 94, 0.2);
  }
`;

export const SelectedConnectionsSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.15);
  border-radius: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 200px;
`;

export const SummaryLabel = styled.span`
  font-size: 12px;
  color: #6b8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

export const SummaryValue = styled.span`
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SummaryMeta = styled.span`
  font-size: 11px;
  color: #6b8a8a;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ArrowIcon = styled.span`
  color: #22c55e;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;

  @media (max-width: 640px) {
    transform: rotate(90deg);
    margin-left: 4px;
  }
`;

export const InfoNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(8, 75, 140, 0.1);
  border: 1px solid rgba(8, 75, 140, 0.2);
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 1.5;
  color: #9db3b8;
`;

export const InfoIcon = styled.span`
  flex-shrink: 0;
  font-size: 16px;
  margin-top: 1px;
`;

export const ConnectionSelectors = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px;
  background: rgba(8, 75, 140, 0.05);
  border: 1px solid rgba(8, 75, 140, 0.15);
  border-radius: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

export const SelectorGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 280px;
`;

export const SelectorLabel = styled.label`
  font-size: 12px;
  color: #6b8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

export const ConnectionSelect = styled.select`
  background: #0a1a2a;
  border: 1px solid #1e3a4a;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  min-width: 0;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #0a1a2a;
    color: #e2e8f0;
  }
`;

export const LoadingConnections = styled.span`
  font-size: 12px;
  color: #6b8a8a;
  font-style: italic;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

export const LiveIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  margin-left: 6px;
  background: #22c55e;
  border-radius: 50%;
  animation: ${pulse} 1s ease-in-out infinite;
`;