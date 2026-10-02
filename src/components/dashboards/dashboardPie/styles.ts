// styles.ts
import styled from 'styled-components';

export const Container = styled.div`
  width: 100vw;
  min-height: 100vh;
  background: #0A1428;
  color: #E0F2FF;
  font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden;
`;

export const Navbar = styled.header`
  height: 64px;
  background: #11223D;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 24px;
  border-bottom: 1px solid #1E2A44;
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

export const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #00D4FF;
`;

export const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

export const RefreshButton = styled.button`
  background: #00FF9F;
  color: #0A1428;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #00D4FF;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 480px) {
    padding: 10px 16px;
    font-size: 14px;
  }
`;

export const MobileMenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #E0F2FF;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: #1E2A44;
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const Main = styled.div`
  display: flex;
  min-height: calc(100vh - 64px);
`;

export const Sidebar = styled.aside<{ $isOpen?: boolean; $collapsed?: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '56px' : '240px')};
  min-width: ${({ $collapsed }) => ($collapsed ? '56px' : '240px')};
  background: #11223D;
  padding: ${({ $collapsed }) => ($collapsed ? '24px 0' : '24px 12px')};
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid #1E2A44;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    top: 64px;
    left: 0;
    height: calc(100vh - 64px);
    width: ${({ $isOpen, $collapsed }) => ($isOpen ? ($collapsed ? '56px' : '260px') : '0')};
    min-width: ${({ $isOpen, $collapsed }) => ($isOpen ? ($collapsed ? '56px' : '260px') : '0')};
    z-index: 200;
    transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
    overflow-y: auto;
  }

  &[data-collapsed="true"] .menu-item-label,
  &[data-collapsed="true"] .sidebar-nav-gap {
    opacity: 0;
    visibility: hidden;
    width: 0;
  }

  &[data-collapsed="true"] .menu-item {
    justify-content: center;
    padding: 14px 0;
  }
`;

export const SidebarToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin: 0 auto 16px;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00D4FF;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const SidebarNav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
`;

export const MenuItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#1E2A44' : 'transparent')};
  color: ${({ $active }) => ($active ? '#00D4FF' : '#E0F2FF')};
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  width: 100%;
  border: none;
  justify-content: flex-start;
  className: "menu-item";

  span.menu-item-label {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.2s ease, visibility 0.2s ease, width 0.2s ease;
    overflow: hidden;
    white-space: nowrap;
  }

  &:hover {
    background: #1E2A44;
    color: #00D4FF;
  }

  @media (max-width: 768px) {
    padding: 16px 24px;
    font-size: 16px;
  }
`;

export const SidebarOverlay = styled.div<{ $isOpen?: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 150;
  }
`;

export const Content = styled.main`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-width: 0;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

export const KpisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const KpiCard = styled.div`
  background: #11223D;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 212, 255, 0.15);
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

export const KpiTitle = styled.div`
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
`;

export const KpiValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #00FF9F;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

export const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

export const ChartCard = styled.div`
  background: #11223D;
  border-radius: 12px;
  padding: 24px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const ChartTitle = styled.h2`
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #E0F2FF;

  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 16px;
  }
`;

export const TableContainer = styled.div`
  background: #11223D;
  border-radius: 12px;
  padding: 20px;
  overflow-x: auto;

  @media (max-width: 768px) {
    padding: 16px;
    margin: 0 -16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

export const TableTitle = styled.h3`
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #E0F2FF;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;

  th,
  td {
    padding: 14px;
    text-align: left;
    border-bottom: 1px solid #1E2A44;
    white-space: nowrap;
  }

  th {
    font-weight: 600;
    opacity: 0.8;
    color: #00D4FF;
  }

  td {
    color: #E0F2FF;
  }

  tr:hover td {
    background: #1E2A44;
  }

  @media (max-width: 480px) {
    th,
    td {
      padding: 12px 10px;
      font-size: 13px;
    }
  }
`;

export const LegendContainer = styled.div`
  background: #11223D;
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;

  @media (max-width: 768px) {
    padding: 16px;
    margin: 16px -16px 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

export const LegendTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #00D4FF;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

export const LegendList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  list-style: none;
  margin: 0;
  padding: 0;
  justify-content: center;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
`;

export const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #E0F2FF;
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 12px;
    gap: 6px;
  }
`;

export const LegendColorDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 10px;
    height: 10px;
  }
`;

export const LegendLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;

  span:last-child {
    opacity: 0.7;
    font-size: 12px;
    color: #00FF9F;
  }

  @media (max-width: 480px) {
    span:last-child {
      font-size: 11px;
    }
  }
`;