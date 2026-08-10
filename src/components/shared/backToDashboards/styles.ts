import styled from "styled-components";
import Link from "next/link";

export const Toolbar = styled.div`
  position: absolute;
  top: 100px;
  right: 60px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 1024px) {
    right: 32px;
    top: 90px;
  }

  @media (max-width: 768px) {
    right: 20px;
    top: 72px;
  }

  @media (max-width: 640px) {
    right: 12px;
    top: 64px;
  }
`;

export const BackButton = styled(Link)`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  text-decoration: none;

  &:hover {
    background: rgba(52, 211, 153, 0.15);
    border-color: rgba(52, 211, 153, 0.40);
    color: #34d399;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 12px;
  }

  @media (max-width: 640px) {
    padding: 6px 8px;
    font-size: 11px;
  }
`;

export const ArrowIcon = styled.span`
  font-size: 14px;
  line-height: 1;
`;

export const Label = styled.span`
  @media (max-width: 700px) {
    display: none;
  }
`;