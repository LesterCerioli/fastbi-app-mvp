import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

export const Background = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

export const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4),
    rgba(0, 0, 0, 0.7)
  );
  z-index: 2;
`;

export const Card = styled.div`
  position: relative;
  z-index: 3;
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 25px;

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #111827;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin-top: 5px;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;

  label {
    font-size: 13px;
    margin-bottom: 5px;
    color: #374151;
  }

  input {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    outline: none;
    font-size: 14px;

    &:focus {
      border-color: #22c55e;
    }
  }
`;

export const Options = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  label {
    font-size: 13px;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  a {
    font-size: 13px;
    color: #22c55e;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const Button = styled.button`
  background: #22c55e;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: #16a34a;
  }
`;

export const Footer = styled.div`
  margin-top: 15px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;

  span {
    color: #22c55e;
    font-weight: 600;
    cursor: pointer;
  }
`;

export const Select = styled.select`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    border-color: #22c55e;
  }
`;

export const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 15px;
  text-align: center;
`;

export const ForgotLink = styled.a`
  display: block;
  text-align: right;
  font-size: 13px;
  color: #22c55e;
  text-decoration: none;
  cursor: pointer;
  margin-bottom: 15px;

  &:hover {
    text-decoration: underline;
  }
`;

export const CancelButton = styled.button`
  background: transparent;
  color: #dc2626;
  padding: 10px;
  border: 1px solid #dc2626;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  margin-top: 8px;

  &:hover {
    background: #dc2626;
    color: white;
  }
`;