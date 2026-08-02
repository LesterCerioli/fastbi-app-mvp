import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

export const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const Title = styled.h3`
  font-family: "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
  margin: 0;
`;

export const Subtitle = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #6b8388;
`;

export const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 8px 16px;
  color: #8ba3a8;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    color: #ffffff;
  }
`;

export const EditorCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Textarea = styled.textarea`
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  padding: 14px 16px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 13px;
  color: #d4f0e6;
  resize: vertical;
  min-height: 160px;
  outline: none;
  line-height: 1.6;
  transition: border-color 0.2s;

  &::placeholder {
    color: #6b8388;
  }

  &:focus {
    border-color: #34d399;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const RunButton = styled.button`
  background: #34d399;
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  color: #06231b;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #2ec08a;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(6, 35, 27, 0.25);
  border-top-color: #06231b;
  border-radius: 50%;
  animation: sqlspin 0.7s linear infinite;

  @keyframes sqlspin {
    to { transform: rotate(360deg); }
  }
`;

export const ConnectionTag = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.10);
  border: 1px solid rgba(52, 211, 153, 0.25);
  padding: 4px 12px;
  border-radius: 20px;
`;

export const ResultMeta = styled.div`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #8ba3a8;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.20);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fca5a5;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 12px;
  color: #d4f0e6;
`;

export const THead = styled.thead`
  th {
    text-align: left;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    color: #8ba3a8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 11px;
    white-space: nowrap;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

export const TBody = styled.tbody`
  td {
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: rgba(255, 255, 255, 0.03);
  }
`;

export const EmptyResult = styled.div`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  color: #6b8388;
  text-align: center;
  padding: 24px 0;
`;
