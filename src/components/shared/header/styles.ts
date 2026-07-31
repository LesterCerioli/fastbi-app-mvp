import styled from "styled-components";

export const Container = styled.header`
  position: absolute;
  top: 0;
  width: 100%;
  padding: 20px 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  background: transparent;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 16px 24px;
  }

  @media (max-width: 640px) {
    padding: 12px 20px;
  }
`;

export const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  img {
    height: 40px;
    width: auto;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    img {
      height: 32px;
    }
  }
`;

export const LogoText = styled.h1`
  color: white;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00D4FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

export const Nav = styled.nav`
  display: flex;
  gap: 32px;
  align-items: center;

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

export const NavItem = styled.a<{ active?: boolean }>`
  color: ${({ active }) => active ? '#00D4FF' : 'white'};
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${({ active }) => active ? '600' : '500'};
  transition: all 0.3s ease;
  position: relative;
  padding-bottom: 4px;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: ${({ active }) => active ? '100%' : '0'};
    height: 2px;
    background: linear-gradient(90deg, #00D4FF, #22c55e);
    transition: width 0.3s ease;
  }

  &:hover {
    color: #00D4FF;
  }

  &:hover::after {
    width: 100%;
  }

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 640px) {
    gap: 6px;
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

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  ${({ variant = 'primary' }) => 
    variant === 'primary' 
      ? `
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        }
      `
      : `
        background: #f97316;
        color: white;
        border: none;
        
        &:hover {
          background: #ea580c;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }
      `
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 13px;
  }

  @media (max-width: 640px) {
    padding: 6px 10px;
    font-size: 11px;
  }
`;

export const UserInfo = styled.span`
  font-size: 14px;
  color: #FFFFFF;
  font-weight: 500;
  white-space: nowrap;
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94A3B8;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #FFFFFF;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 12px;
  }
`;

export const HideMobile = styled.div`
  display: block;

  @media (max-width: 640px) {
    display: none;
  }
`;

export const Hamburger = styled.button`
  display: none;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  font-size: 18px;
  padding: 0;

  @media (max-width: 640px) {
    display: flex;
  }
`;

export const MobileOverlay = styled.div<{ $open: boolean }>`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(12px);
  z-index: 15;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: opacity 0.3s ease;
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};

  @media (max-width: 640px) {
    display: flex;
  }
`;

export const MobileNavItem = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  color: ${({ $active }) => ($active ? "#22c55e" : "white")};
  font-size: 20px;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s;

  &:hover {
    color: #22c55e;
  }
`;

export const MobileButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  width: 200px;
`;