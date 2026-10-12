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