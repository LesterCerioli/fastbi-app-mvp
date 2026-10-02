import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
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
  gap: 16px;
  border-bottom: 1px solid #1E2A44;
`;

export const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #00D4FF;
`;

export const TitleIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: #00D4FF;
  flex-shrink: 0;
`;

export const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  flex: 1;
`;

export const Filters = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const Filter = styled.button`
  background: #1E2A44;
  color: #E0F2FF;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  &:hover {
    background: #2A3A5A;
  }
`;

export const UpdateButton = styled.button`
  background: #00D4FF;
  color: #0A1428;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    background: #00FF9F;
    transform: translateY(-1px);
  }
`;

export const SidebarToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #1E2A44;
  border: 1px solid #2A3A5A;
  color: #E0F2FF;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #2A3A5A;
  }
`;

export const Main = styled.div`
  display: flex;
  height: calc(100vh - 64px);
`;

export const MenuItem = styled.button<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'rgba(0, 212, 255, 0.1)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#00D4FF' : '#94A3B8')};
  border: ${({ $active }) => ($active ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent')};
  transition: all 0.2s ease;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  &:hover {
    background: rgba(0, 212, 255, 0.08);
    color: #00D4FF;
  }
  span {
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  svg {
    flex-shrink: 0;
  }
`;

export const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  width: 100%;
`;

export const Sidebar = styled.aside<{ $collapsed?: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '64px' : '240px')};
  min-width: ${({ $collapsed }) => ($collapsed ? '64px' : '240px')};
  max-width: ${({ $collapsed }) => ($collapsed ? '64px' : '240px')};
  background: #11223D;
  border-right: 1px solid #1E2A44;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease;
`;

export const Content = styled.main`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-width: 0;
`;

export const KpisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
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
`;

export const KpiTitle = styled.div`
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
`;

export const KpiValue = styled.div<{ color: string }>`
  font-size: 28px;
  font-weight: 700;
  color: ${({ color }) => color};
`;

export const KpiVariation = styled.div<{ color: string }>`
  font-size: 15px;
  color: ${({ color }) => color};
  margin-top: 8px;
`;

export const ChartCard = styled.div`
  background: #11223D;
  border-radius: 12px;
  padding: 24px;
  flex: 1;
`;

export const ChartTitle = styled.h2`
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
`;

export const TableContainer = styled.div`
  background: #11223D;
  border-radius: 12px;
  padding: 20px;
`;

export const TableTitle = styled.h3`
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 14px;
    text-align: left;
    border-bottom: 1px solid #1E2A44;
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
`;