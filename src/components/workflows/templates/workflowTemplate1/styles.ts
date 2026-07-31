import styled from "styled-components";

export const Card = styled.div`
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #22c55e;
    transform: translateY(-2px);
  }
`;

export const Title = styled.h3`
  color: #f1f5f9;
  margin: 0 0 12px;
  font-size: 16px;
`;

export const Description = styled.p`
  color: #94a3b8;
  margin: 0 0 16px;
  font-size: 13px;
`;

export const TagList = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const Tag = styled.span<{ $color: string }>`
  background: #0f172a;
  color: ${({ $color }) => $color};
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
`;
