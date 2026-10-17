import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 720px;
  margin: 24px auto 0;
`;

export const Loading = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #6b8388;
  font-size: 14px;
`;

export const Empty = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #6b8388;
  font-size: 14px;
`;

export const BucketCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
  }
`;

export const BucketHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

export const BucketIcon = styled.span`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #22c55e, #34d399);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #04210f;
  font-size: 16px;
  flex-shrink: 0;
`;

export const BucketInfo = styled.div`
  flex: 1;
`;

export const BucketName = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

export const BucketDesc = styled.p`
  font-size: 12px;
  color: #9db3b8;
  margin: 4px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

export const BucketActions = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const DeleteButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.10);
    border-color: #ef4444;
  }
`;

export const SkeletonCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  height: 80px;
  margin-bottom: 16px;
`;

export const SkeletonRow = styled.div`
  height: 12px;
  border-radius: 4px;
  background: transparent;
  margin: 4px 0;
`;

export const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1100;
`;

export const ConfirmDialog = styled.div`
  background: #0d1f1a;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

export const ConfirmTitle = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
  margin: 0;
`;

export const ConfirmMessage = styled.p`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: #c7d4d4;
  margin: 0;
  line-height: 1.5;
`;

export const ConfirmBucketName = styled.span`
  font-weight: 600;
  color: #f87171;
`;

export const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`;

export const ConfirmCancel = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: transparent;
  color: #ffffff;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: #9db3b8;
  }
`;

export const ConfirmDelete = styled.button`
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
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
  font-size: 14px;
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