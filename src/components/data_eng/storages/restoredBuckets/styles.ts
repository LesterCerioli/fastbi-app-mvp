import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 720px;
  margin: 32px auto 0;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export const SectionTitle = styled.h2`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
  margin: 0 0 4px;
`;

export const SectionSubtitle = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #9db3b8;
  margin: 0 0 16px;
`;

export const Loading = styled.div`
  padding: 24px 20px;
  text-align: center;
  color: #6b8388;
  font-size: 14px;
`;

export const RestoredCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 12px;
  transition: border-color 0.2s;
`;

export const RestoredHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const RestoredIcon = styled.span`
  width: 32px;
  height: 32px;
  background: rgba(157, 179, 184, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9db3b8;
  font-size: 16px;
  flex-shrink: 0;
`;

export const RestoredInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const RestoredName = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #c7d4d4;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RestoredDesc = styled.p`
  font-size: 12px;
  color: #6b8388;
  margin: 4px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RestoredDate = styled.p`
  font-size: 11px;
  color: #6b8388;
  margin: 4px 0 0;
`;

export const RestoreButton = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  border: 1px solid rgba(34, 197, 94, 0.45);
  background: rgba(34, 197, 94, 0.10);
  color: #34d399;
  transition: background 0.2s, border-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(34, 197, 94, 0.20);
    border-color: #22c55e;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const StatusBanner = styled.div<{ $variant: "success" | "error" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
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