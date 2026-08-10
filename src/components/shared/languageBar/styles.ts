import styled from "styled-components";

export const Bar = styled.div`
  position: relative;
`;

export const LangLabel = styled.span`
  @media (max-width: 700px) {
    display: none;
  }
`;

export const LangWrapper = styled.div`
  position: relative;
`;

export const LangButton = styled.button`
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

  &:hover {
    background: rgba(255, 255, 255, 0.15);
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

export const LangDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #0A1A14;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 6px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);

  @media (max-width: 640px) {
    min-width: 160px;
    right: auto;
    left: 0;
  }
`;

export const LangOption = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  background: ${({ $active }) => $active ? 'rgba(34, 197, 94, 0.15)' : 'transparent'};
  color: ${({ $active }) => $active ? '#34d399' : '#dfe9e9'};
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(34, 197, 94, 0.10);
    color: #34d399;
  }
`;
