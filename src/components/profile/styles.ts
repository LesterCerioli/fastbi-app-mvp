import styled from "styled-components";

export const Wrapper = styled.div`
  min-height: 100vh;
  background: #0A0F1F;
  color: #FFFFFF;
  padding: 120px 40px 60px;

  @media (max-width: 768px) {
    padding: 110px 20px 40px;
  }
`;

export const Container = styled.div`
  max-width: 860px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease-out;
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 24px;
`;

export const Card = styled.div`
  background: rgba(17, 34, 61, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  margin-bottom: 24px;
`;

export const ProfileSection = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

export const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

export const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #00D4FF;
  background: rgba(255, 255, 255, 0.08);
`;

export const AvatarPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 700;
  color: #0A0F1F;
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
`;

export const UploadBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.35);
  color: #00D4FF;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(0, 212, 255, 0.18);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const FileInput = styled.input`
  display: none;
`;

export const DataSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;
`;

export const Value = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
`;

export const Message = styled.div<{ $error?: boolean }>`
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  background: ${({ $error }) => ($error ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)")};
  color: ${({ $error }) => ($error ? "#fca5a5" : "#4ade80")};
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 20px;

  svg {
    color: #00D4FF;
  }
`;

export const SectionSubtitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #E2E8F0;
  margin: 24px 0 12px;
`;

export const NextChargeCard = styled.div`
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
  border-radius: 14px;
  padding: 20px 24px;
  color: #0A0F1F;
`;

export const NextChargeLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: rgba(10, 15, 31, 0.7);
`;

export const NextChargeAmount = styled.div`
  font-size: 32px;
  font-weight: 700;
  margin: 6px 0 16px;
`;

export const NextChargeDetails = styled.div`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  font-weight: 600;
`;

export const MetaLabel = styled.span`
  font-size: 12px;
  color: rgba(10, 15, 31, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const InvoiceList = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

export const InvoiceHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;

  @media (max-width: 560px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const InvoiceRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  align-items: center;
  font-size: 14px;
  color: #E2E8F0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const StatusBadge = styled.span`
  justify-self: start;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-size: 12px;
  font-weight: 600;
`;

export const DownloadBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #00D4FF 0%, #00FF9F 100%);
  color: #0A0F1F;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
  }

  @media (max-width: 560px) {
    grid-column: 1 / -1;
    justify-content: center;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #94A3B8;
  font-size: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  justify-content: center;
`;
