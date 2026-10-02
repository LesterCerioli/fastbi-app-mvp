"use client";
import React, { useState, useCallback } from 'react';
import * as S from "./styles";
import ChartsOrganizationKpis from "@/components/kpis/chartsOrganization/chartsOrganization";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { ChevronLeft, ChevronRight, LayoutDashboard, Activity, BarChart2, FileText, Settings } from 'lucide-react';

interface ForecastItem {
  month: string;
  forecasted_revenue: number;
  seasonal_factor?: number;
}

interface HistoricalItem {
  month: string;
  revenue: number;
}

interface KPIData {
  currentPeriod: {
    totalValue: number;
    vsPreviousPercent: number;
    projectedTotal: number;
    onTrackPercent: number;
  };
}

interface Props {
  organizationName: string | null;
  forecastData: Record<string, unknown> | null;
  executiveSummary: Record<string, unknown> | null;
  /** Define qual menu inicia ativo (ex: 'analytics' na página de Analytics) */
  initialMenu?: MenuItem;
}

type MenuItem = 'overview' | 'forecasts' | 'analytics' | 'reports' | 'settings';

function formatMonth(isoMonth: string): string {
  const d = new Date(isoMonth + "-01");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[d.getMonth()] + "/" + String(d.getFullYear()).slice(-2);
}

function fmtCurrency(value: number): string {
  if (value >= 1000000) return "$" + (value / 1000000).toFixed(2) + "M";
  if (value >= 1000) return "$" + (value / 1000).toFixed(0) + "K";
  return "$" + value.toFixed(0);
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

function buildChartData(hist: HistoricalItem[] | null, forecast: ForecastItem[] | null) {
  const data: { month: string; historical: number | null; forecast: number | null }[] = [];
  if (hist) {
    for (const item of hist) {
      data.push({ month: formatMonth(item.month), historical: item.revenue, forecast: null });
    }
  }
  if (forecast) {
    for (const item of forecast) {
      const formatted = formatMonth(item.month);
      const existing = data.find(d => d.month === formatted);
      if (existing) {
        existing.forecast = item.forecasted_revenue;
      } else {
        data.push({ month: formatted, historical: null, forecast: item.forecasted_revenue });
      }
    }
  }
  return data;
}

const MainPredictiveDashboard: React.FC<Props> = ({ organizationName, forecastData, executiveSummary, initialMenu = 'overview' }) => {
  const [activeMenu, setActiveMenu] = useState<MenuItem>(initialMenu);
  const [fetchedData, setFetchedData] = useState<Record<string, unknown> | null>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const hist = forecastData?.historical_data as HistoricalItem[] | undefined;
  const forecast = forecastData?.forecast as ForecastItem[] | undefined;
  const chartData = buildChartData(hist ?? null, forecast ?? null);
  const summary = executiveSummary as KPIData | null;

  const kpis = [
    {
      title: 'Forecasted Revenue',
      value: summary?.currentPeriod?.projectedTotal != null ? fmtCurrency(summary.currentPeriod.projectedTotal) : "—",
      variation: summary?.currentPeriod?.vsPreviousPercent != null ? fmtPercent(summary.currentPeriod.vsPreviousPercent) : "—",
      color: '#00FF9F',
    },
    {
      title: 'Current Revenue',
      value: summary?.currentPeriod?.totalValue != null ? fmtCurrency(summary.currentPeriod.totalValue) : "—",
      variation: "",
      color: '#00D4FF',
    },
    {
      title: 'Model Accuracy',
      value: summary?.currentPeriod?.onTrackPercent != null ? summary.currentPeriod.onTrackPercent.toFixed(0) + "%" : "—",
      variation: "↑",
      color: '#00D4FF',
    },
    {
      title: 'Projected Growth',
      value: summary?.currentPeriod?.vsPreviousPercent != null ? fmtPercent(summary.currentPeriod.vsPreviousPercent) : "—",
      variation: "↑",
      color: '#00FF9F',
    },
  ];

  const menuIcons: Record<MenuItem, React.ReactNode> = {
    overview: <LayoutDashboard size={20} />,
    forecasts: <Activity size={20} />,
    analytics: <BarChart2 size={20} />,
    reports: <FileText size={20} />,
    settings: <Settings size={20} />,
  };

  const handleMenuClick = useCallback(async (item: MenuItem) => {
    if (item === 'overview') {
      setActiveMenu('overview');
      setFetchedData(null);
      setReportData(null);
      return;
    }

    setActiveMenu(item);
    setLoading(true);

    try {
      const token = await getFreshToken();
      const combined: Record<string, unknown> = {};

      if (item === 'forecasts') {
        const res = await fetch(`/api/analytics/sales/forecast?organization_name=${encodeURIComponent(organizationName || "")}&months_ahead=12`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) Object.assign(combined, await res.json());
      } else if (item === 'analytics') {
        const [revRes, seasRes] = await Promise.all([
          fetch(`/api/analytics/sales/revenue-insights?organization_name=${encodeURIComponent(organizationName || "")}`, {
            headers: { "Authorization": `Bearer ${token}` },
          }),
          fetch(`/api/analytics/executive/seasonality`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ organization_name: organizationName, granularity: "month" }),
          }),
        ]);
        if (revRes.ok) Object.assign(combined, await revRes.json());
        if (seasRes.ok) combined.seasonality = await seasRes.json();
      } else if (item === 'reports') {
        const res = await fetch("/api/reports", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) setReportData(await res.json());
      }

      setFetchedData(combined);
    } catch {
      setFetchedData(null);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [organizationName]);

  const renderContent = () => {
    if (activeMenu !== 'overview' && loading) {
      return (
        <S.Content>
          <S.KpisGrid>
            {[1, 2, 3, 4].map((i) => (
              <S.KpiCard key={i}>
                <S.KpiTitle>Loading...</S.KpiTitle>
                <S.KpiValue color="#1E2A44">────</S.KpiValue>
              </S.KpiCard>
            ))}
          </S.KpisGrid>
          <S.ChartCard>
            <S.ChartTitle>Loading chart...</S.ChartTitle>
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #11223D 25%, #1A3050 50%, #11223D 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 8 }}>
              <span style={{ color: '#64748B', fontSize: 14 }}>Carregando dados...</span>
            </div>
          </S.ChartCard>
          <S.ChartCard>
            <S.ChartTitle>Loading trend...</S.ChartTitle>
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #11223D 25%, #1A3050 50%, #11223D 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 8 }}>
              <span style={{ color: '#64748B', fontSize: 14 }}>Carregando tendência...</span>
            </div>
          </S.ChartCard>
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </S.Content>
      );
    }

    if (activeMenu === 'overview') {
      return (
        <S.Content>
          <S.KpisGrid>
            {kpis.map((kpi, i) => (
              <S.KpiCard key={i}>
                <S.KpiTitle>{kpi.title}</S.KpiTitle>
                <S.KpiValue color={kpi.color}>{kpi.value}</S.KpiValue>
                <S.KpiVariation color={kpi.color}>{kpi.variation}</S.KpiVariation>
              </S.KpiCard>
            ))}
          </S.KpisGrid>
          <S.ChartCard>
            <S.ChartTitle>Historical Evolution + Revenue Forecast</S.ChartTitle>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A44" />
                <XAxis dataKey="month" stroke="#64748B" />
                <YAxis
                  stroke="#64748B"
                  tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => {
                    if (value === undefined || value === null) return ['N/A', 'Value'];
                    const numValue = typeof value === 'string' ? parseFloat(value) : value;
                    return [`$${(numValue / 1000).toFixed(0)}k`, 'Value'];
                  }}
                  contentStyle={{ backgroundColor: '#11223D', borderColor: '#1E2A44' }}
                  labelStyle={{ color: '#E0F2FF' }}
                />
                <Legend wrapperStyle={{ color: '#E0F2FF' }} />
                <Line type="monotone" dataKey="historical" stroke="#00D4FF" strokeWidth={3} dot={false} name="Historical" />
                <Line type="monotone" dataKey="forecast" stroke="#00FF9F" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Forecast" />
                <Area type="monotone" dataKey="forecast" fill="#00FF9F" fillOpacity={0.15} stroke="none" />
              </LineChart>
            </ResponsiveContainer>
          </S.ChartCard>
          <S.TableContainer>
            <S.TableTitle>Detailed Forecasts</S.TableTitle>
            <S.Table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Forecasted Revenue</th>
                  <th>Seasonal Factor</th>
                </tr>
              </thead>
              <tbody>
                {(forecast ?? []).slice(0, 6).map((item, i) => (
                  <tr key={i}>
                    <td>{formatMonth(item.month)}</td>
                    <td>{fmtCurrency(item.forecasted_revenue)}</td>
                    <td>{(item.seasonal_factor ?? 1).toFixed(2)}x</td>
                  </tr>
                ))}
                {(!forecast || forecast.length === 0) && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#64748B' }}>No forecast data available</td>
                  </tr>
                )}
              </tbody>
            </S.Table>
          </S.TableContainer>
        </S.Content>
      );
    }

    if (activeMenu === 'forecasts') {
      const fc = fetchedData?.forecast as ForecastItem[] | undefined;
      return (
        <S.Content>
          <S.ChartCard>
            <S.ChartTitle>Revenue Forecast</S.ChartTitle>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={buildChartData(fetchedData?.historical_data as HistoricalItem[] ?? null, fc ?? null)} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A44" />
                <XAxis dataKey="month" stroke="#64748B" />
                <YAxis stroke="#64748B" tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => value != null ? [`$${((typeof value === 'string' ? parseFloat(value) : Number(value)) / 1000).toFixed(0)}k`, 'Value'] : ['N/A', 'Value']}
                  contentStyle={{ backgroundColor: '#11223D', borderColor: '#1E2A44' }}
                  labelStyle={{ color: '#E0F2FF' }}
                />
                <Legend wrapperStyle={{ color: '#E0F2FF' }} />
                <Line type="monotone" dataKey="historical" stroke="#00D4FF" strokeWidth={3} dot={false} name="Historical" />
                <Line type="monotone" dataKey="forecast" stroke="#00FF9F" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </S.ChartCard>
          <S.TableContainer>
            <S.TableTitle>All Forecast Periods</S.TableTitle>
            <S.Table>
              <thead><tr><th>Period</th><th>Forecasted Revenue</th><th>Seasonal Factor</th></tr></thead>
              <tbody>
                {(fc ?? []).map((item, i) => (
                  <tr key={i}><td>{formatMonth(item.month)}</td><td>{fmtCurrency(item.forecasted_revenue)}</td><td>{(item.seasonal_factor ?? 1).toFixed(2)}x</td></tr>
                ))}
              </tbody>
            </S.Table>
          </S.TableContainer>
        </S.Content>
      );
    }

    if (activeMenu === 'analytics') {
      const metrics = fetchedData?.key_metrics as Record<string, number> | undefined;
      const seasonality = fetchedData?.seasonality as Record<string, unknown> | undefined;
      const seasons = seasonality?.periods as { name: string; revenue: number; growth: number }[] | undefined;
      return (
        <S.Content>
          <S.KpisGrid>
            <S.KpiCard><S.KpiTitle>Total Revenue</S.KpiTitle><S.KpiValue color="#00FF9F">{metrics?.total_revenue != null ? fmtCurrency(metrics.total_revenue) : "—"}</S.KpiValue></S.KpiCard>
            <S.KpiCard><S.KpiTitle>Total Quantity</S.KpiTitle><S.KpiValue color="#00D4FF">{metrics?.total_quantity != null ? metrics.total_quantity.toLocaleString() : "—"}</S.KpiValue></S.KpiCard>
            <S.KpiCard><S.KpiTitle>Avg Transaction</S.KpiTitle><S.KpiValue color="#FF9F00">{metrics?.avg_transaction_value != null ? fmtCurrency(metrics.avg_transaction_value) : "—"}</S.KpiValue></S.KpiCard>
            <S.KpiCard><S.KpiTitle>Transactions</S.KpiTitle><S.KpiValue color="#00FF9F">{metrics?.total_transactions != null ? metrics.total_transactions.toLocaleString() : "—"}</S.KpiValue></S.KpiCard>
          </S.KpisGrid>
          {seasons && seasons.length > 0 && (
            <S.TableContainer>
              <S.TableTitle>Seasonality Analysis</S.TableTitle>
              <S.Table>
                <thead><tr><th>Period</th><th>Revenue</th><th>Growth</th></tr></thead>
                <tbody>
                  {seasons.map((s, i) => (
                    <tr key={i}><td>{s.name}</td><td>{fmtCurrency(s.revenue)}</td><td>{fmtPercent(s.growth)}</td></tr>
                  ))}
                </tbody>
              </S.Table>
            </S.TableContainer>
          )}
          <ChartsOrganizationKpis organizationName={organizationName} />
        </S.Content>
      );
    }

    if (activeMenu === 'reports') {
      const statusDist = reportData?.statusDistribution as Record<string, unknown> | null;
      const failureRates = reportData?.failureRates as Record<string, unknown> | null;
      const activity = reportData?.activityMetrics as Record<string, unknown> | null;
      const statusCounts = (statusDist as Record<string, unknown>)?.statusCounts as Array<{ status: string; count: number }> || [];
      const metrics = (activity as Record<string, unknown>) || {};
      const dailyFailures = (failureRates as Record<string, unknown>)?.daily as Array<{ date: string; failureRatePct: number }> | undefined;
      return (
        <S.Content>
          <S.KpisGrid>
            <S.KpiCard>
              <S.KpiTitle>Total Report Runs</S.KpiTitle>
              <S.KpiValue color="#00FF9F">{(metrics.totalRuns as number) ?? 0}</S.KpiValue>
            </S.KpiCard>
            <S.KpiCard>
              <S.KpiTitle>Active Templates</S.KpiTitle>
              <S.KpiValue color="#00D4FF">{(metrics.totalTemplates as number) ?? 0}</S.KpiValue>
            </S.KpiCard>
            <S.KpiCard>
              <S.KpiTitle>Active Schedules</S.KpiTitle>
              <S.KpiValue color="#FF9F00">{(metrics.activeSchedules as number) ?? 0}</S.KpiValue>
            </S.KpiCard>
            <S.KpiCard>
              <S.KpiTitle>Success Rate</S.KpiTitle>
              <S.KpiValue color="#00FF9F">{(metrics.successRatePct as number) ?? 0}%</S.KpiValue>
            </S.KpiCard>
          </S.KpisGrid>
          {statusCounts.length > 0 && (
            <S.ChartCard>
              <S.ChartTitle>Report Status Distribution</S.ChartTitle>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={statusCounts} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#00FF9F" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A44" />
                  <XAxis dataKey="status" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip contentStyle={{ backgroundColor: '#11223D', borderColor: '#1E2A44' }} labelStyle={{ color: '#E0F2FF' }} />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </S.ChartCard>
          )}
          {dailyFailures && dailyFailures.length > 0 && (
            <S.ChartCard>
              <S.ChartTitle>Failure Rate Trend (30 days)</S.ChartTitle>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyFailures} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A44" />
                  <XAxis dataKey="date" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip contentStyle={{ backgroundColor: '#11223D', borderColor: '#1E2A44' }} labelStyle={{ color: '#E0F2FF' }} />
                  <Area type="monotone" dataKey="failureRatePct" stroke="none" fill="url(#lineGradient)" fillOpacity={1} />
                  <Line type="monotone" dataKey="failureRatePct" stroke="#FF4D4D" strokeWidth={3} dot={false} name="Failure Rate %" animationDuration={1200} />
                </LineChart>
              </ResponsiveContainer>
            </S.ChartCard>
          )}
        </S.Content>
      );
    }

    return (
      <S.Content>
        <div style={{ color: '#E0F2FF', textAlign: 'center', padding: 40 }}>
          <h3>Settings</h3>
          <p>Settings panel coming soon.</p>
        </div>
      </S.Content>
    );
  };

  const pageTitle = 
    activeMenu === 'overview' ? 'Predictive Dashboards – Sales Forecast' :
    `Predictive Dashboards – ${activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}`;

  return (
    <S.Container>
      <S.Navbar>
        <S.Logo>FastBI</S.Logo>
        <S.TitleIcon aria-hidden="true">
          {menuIcons[activeMenu]}
        </S.TitleIcon>
        <S.Title>{pageTitle}</S.Title>
        <S.SidebarToggle onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </S.SidebarToggle>
        <S.Filters>
          <S.Filter>{forecast?.[0]?.month ? formatMonth(forecast[0].month) + " – " + formatMonth(forecast[forecast.length - 1].month) : "No data"}</S.Filter>
          <S.Filter>Department: Sales</S.Filter>
          <S.Filter>Region: National</S.Filter>
        </S.Filters>
      </S.Navbar>

      <S.Main>
        <S.Sidebar $collapsed={sidebarCollapsed} data-collapsed={sidebarCollapsed}>
          <S.SidebarNav>
            <S.MenuItem $active={activeMenu === 'overview'} $collapsed={sidebarCollapsed} onClick={() => handleMenuClick('overview')}>
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </S.MenuItem>
            <S.MenuItem $active={activeMenu === 'forecasts'} $collapsed={sidebarCollapsed} onClick={() => handleMenuClick('forecasts')}>
              <Activity size={20} />
              <span>Sales Forecast</span>
            </S.MenuItem>
            <S.MenuItem $active={activeMenu === 'analytics'} $collapsed={sidebarCollapsed} onClick={() => handleMenuClick('analytics')}>
              <BarChart2 size={20} />
              <span>Analytics</span>
            </S.MenuItem>
            <S.MenuItem $active={activeMenu === 'reports'} $collapsed={sidebarCollapsed} onClick={() => handleMenuClick('reports')}>
              <FileText size={20} />
              <span>Reports</span>
            </S.MenuItem>
            <S.MenuItem $active={activeMenu === 'settings'} $collapsed={sidebarCollapsed} onClick={() => handleMenuClick('settings')}>
              <Settings size={20} />
              <span>Settings</span>
            </S.MenuItem>
          </S.SidebarNav>
        </S.Sidebar>

        {renderContent()}
      </S.Main>
    </S.Container>
  );
};

export default MainPredictiveDashboard;