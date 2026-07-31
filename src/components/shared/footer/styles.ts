"use client";

import styled from "styled-components";

export const Container = styled.footer`
  width: 100%;
  background: #0a2540;
  padding: 60px 20px 30px;
  color: white;
`;

export const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

export const Logo = styled.h2`
  font-size: 22px;
  font-weight: 700;
`;

export const Nav = styled.nav`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 24px;

  a {
    cursor: pointer;
    transition: 0.3s;

    &:hover {
      opacity: 0.7;
    }
  }
`;

export const Copy = styled.p`
  margin-top: 30px;
  font-size: 14px;
  opacity: 0.7;
`;