import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 4px;
`;

export const Info = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #8ba3a8;
  font-variant-numeric: tabular-nums;
`;

export const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 8px;
  padding: 6px 12px;
  color: #7dd3fc;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.18);
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(56, 189, 248, 0.45)" : "rgba(255, 255, 255, 0.08)"};
  background: ${({ $active }) =>
    $active ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.04)"};
  color: ${({ $active }) => ($active ? "#7dd3fc" : "#8ba3a8")};
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;

  &:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.14);
    border-color: rgba(56, 189, 248, 0.30);
    color: #7dd3fc;
  }

  &:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export const Ellipsis = styled.span`
  color: #6b8388;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  padding: 0 2px;
  user-select: none;
`;
