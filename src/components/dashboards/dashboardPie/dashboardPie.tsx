"use client";
import React, { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import * as S from "./styles";

const colors = ['#00D4FF', '#00FF9F', '#FF9F00', '#FF4D4D', '#9F4DFF', '#FF69B4', '#4DC9F6', '#A8E6CF'];

interface ProductCategory {
  category: string | null;
  total_revenue: number;
  total_quantity: number;
  transaction_count: number;
  avg_transaction_value: number;
  regions_present: number;
}

interface Props {
  organizationName: string | null;
  productMix: Record<string, unknown> | null;
}

type MenuItem = 'overview' | 'forecasts' | 'analytics';

function fmtCurrency(value: number): string {
  if (value >= 1000000) return "U$ " + (value / 1000000).toFixed(2) + "M";
  if (value >= 1000) return "U$ " + (value / 1000).toFixed(0) + "K";
  return "U$ " + value.toFixed(2);
}

function fmtPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(1) + "%";
}

async function getFreshToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  return data.token;
}

const DashboardPie: React.FC<Props> = ({ organizationName, productMix }) => {
  const [activeMenu, setActiveMenu] = useState<MenuItem>('overview');
  const [fetchedData, setFetchedData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const analysis = productMix?.detailed_analysis as ProductCategory[] | undefined;
  const data = (analysis ?? []).map((item, i) => ({
    name: item.category || "Unknown",
    value: item.total_revenue,
    color: colors[i % colors.length],
    transactions: item.transaction_count,
  }));

  const totalRevenue = data.reduce((sum, d) => sum + d.value, 0);
  const top3 = data.slice(0, 3);

  const handleMenuClick = useCallback(async (item: MenuItem) => {
    if (item === 'overview') {
      setActiveMenu('overview');
      setFetchedData(null);
      return;
    }

    setActiveMenu(item);
    setLoading(true);

    try {
      const token = await getFreshToken();
      const combined: Record<string, unknown> = {};

      if (item === 'forecasts') {
        const res = await fetch(`/api/analytics/sales/forecast?organization_name=${encodeURIComponent(organizationName || "")}&months_ahead=6`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) Object.assign(combined, await res.json());
      } else if (item === 'analytics') {
        const [expRes, seasRes] = await Promise.all([
          fetch(`/api/analytics/sales/expansion-opportunities?organization_name=${encodeURIComponent(organizationName || "")}`, {
            headers: { "Authorization": `Bearer ${token}` },
          }),
          fetch(`/api/analytics/executive/seasonality`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ organization_name: organizationName, granularity: "month" }),
          }),
        ]);
        if (expRes.ok) Object.assign(combined, await expRes.json());
        if (seasRes.ok) combined.seasonality = await seasRes.json();
      }

      setFetchedData(combined);
    } catch {
      setFetchedData(null);
    } finally {
      setLoading(false);
    }
  }, [organizationName]);

  const renderContent = () => {
    if (activeMenu !== 'overview' && loading) {
      return <div style={{ color: '#E0F2FF', textAlign: 'center', padding: 40 }}>Loading...</div>;
    }

    if (activeMenu === 'overview') {
      return (
        <>
          <S.KpisGrid>
            <S.KpiCard>
              <S.KpiTitle>Categories</S.KpiTitle>
              <S.KpiValue>{data.length}</S.KpiValue>
            </S.KpiCard>
            <S.KpiCard>
              <S.KpiTitle>Total Revenue</S.KpiTitle>
              <S.KpiValue>{fmtCurrency(totalRevenue)}</S.KpiValue>
            </S.KpiCard>
            <S.KpiCard>
              <S.KpiTitle>Top Category</S.KpiTitle>
              <S.KpiValue>{data[0]?.name ?? "—"}</S.KpiValue>
            </S.KpiCard>
          </S.KpisGrid>

          <S.ChartsRow>
            <S.ChartCard>
              <S.ChartTitle>Revenue by Category</S.ChartTitle>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%" cy="50%"
                    innerRadius={90} outerRadius={150}
                    dataKey="value" animationDuration={800}
                    label={({ name, percent }) => percent != null ? `${name}: ${(percent * 100).toFixed(0)}%` : name}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [fmtCurrency(Number(value)), 'Revenue']} contentStyle={{ backgroundColor: '#11223D', borderColor: '#1E2A44' }} labelStyle={{ color: '#E0F2FF' }} />
                  <Legend wrapperStyle={{ color: '#E0F2FF' }} />
                </PieChart>
              </ResponsiveContainer>
            </S.ChartCard>

            <S.ChartCard>
              <S.ChartTitle>Top Categories Distribution</S.ChartTitle>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={top3}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={110}
                    dataKey="value" animationDuration={800}
                  >
                    {top3.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [fmtCurrency(Number(value)), 'Revenue']} contentStyle={{ backgroundColor: '#11223D', borderColor: '#1E2A44' }} labelStyle={{ color: '#E0F2FF' }} />
                </PieChart>
              </ResponsiveContainer>
            </S.ChartCard>
          </S.ChartsRow>

          <S.TableContainer>
            <S.TableTitle>Category Breakdown</S.TableTitle>
            <S.Table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Revenue Share</th>
                  <th>Total Revenue</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td>{totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) + "%" : "—"}</td>
                    <td>{fmtCurrency(item.value)}</td>
                    <td>{item.transactions.toLocaleString()}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748B' }}>No product data available</td></tr>
                )}
              </tbody>
            </S.Table>
          </S.TableContainer>
        </>
      );
    }

    if (activeMenu === 'forecasts') {
      const fc = fetchedData?.forecast as { month: string; forecasted_revenue: number }[] | undefined;
      return (
        <S.Content>
          <S.ChartCard>
            <S.ChartTitle>Category Forecast</S.ChartTitle>
            <S.TableContainer>
              <S.Table>
                <thead><tr><th>Period</th><th>Forecasted Revenue</th></tr></thead>
                <tbody>
                  {(fc ?? []).map((item, i) => (
                    <tr key={i}><td>{item.month}</td><td>{fmtCurrency(item.forecasted_revenue)}</td></tr>
                  ))}
                  {(!fc || fc.length === 0) && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: '#64748B' }}>No forecast data</td></tr>
                  )}
                </tbody>
              </S.Table>
            </S.TableContainer>
          </S.ChartCard>
        </S.Content>
      );
    }

    if (activeMenu === 'analytics') {
      const opportunities = fetchedData?.recommendations as { category: string; action: string; current_revenue: number }[] | undefined;
      const seasonality = fetchedData?.seasonality as Record<string, unknown> | undefined;
      const seasons = seasonality?.periods as { name: string; revenue: number; growth: number }[] | undefined;

      return (
        <S.Content>
          <S.ChartCard>
            <S.ChartTitle>Expansion Opportunities</S.ChartTitle>
            <S.TableContainer>
              <S.Table>
                <thead><tr><th>Category</th><th>Action</th><th>Current Revenue</th></tr></thead>
                <tbody>
                  {(opportunities ?? []).map((item, i) => (
                    <tr key={i}><td>{item.category}</td><td>{item.action}</td><td>{fmtCurrency(item.current_revenue)}</td></tr>
                  ))}
                  {(!opportunities || opportunities.length === 0) && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#64748B' }}>No opportunities data</td></tr>
                  )}
                </tbody>
              </S.Table>
            </S.TableContainer>
          </S.ChartCard>

          {seasons && seasons.length > 0 && (
            <S.ChartCard>
              <S.ChartTitle>Seasonality Analysis</S.ChartTitle>
              <S.TableContainer>
                <S.Table>
                  <thead><tr><th>Period</th><th>Revenue</th><th>Growth</th></tr></thead>
                  <tbody>
                    {seasons.map((s, i) => (
                      <tr key={i}><td>{s.name}</td><td>{fmtCurrency(s.revenue)}</td><td>{fmtPercent(s.growth)}</td></tr>
                    ))}
                  </tbody>
                </S.Table>
              </S.TableContainer>
            </S.ChartCard>
          )}
        </S.Content>
      );
    }

    return null;
  };

  return (
    <S.Container>
      <S.Navbar>
        <S.Logo>FastBI</S.Logo>
        <S.Title>Predictive Composition Analysis</S.Title>
      </S.Navbar>

      <S.Main>
        <S.Sidebar>
          <S.MenuItem active={activeMenu === 'overview'} onClick={() => handleMenuClick('overview')}>Overview</S.MenuItem>
          <S.MenuItem active={activeMenu === 'forecasts'} onClick={() => handleMenuClick('forecasts')}>Forecasts</S.MenuItem>
          <S.MenuItem active={activeMenu === 'analytics'} onClick={() => handleMenuClick('analytics')}>Analytics</S.MenuItem>
        </S.Sidebar>

        {renderContent()}
      </S.Main>
    </S.Container>
  );
};

export default DashboardPie;
