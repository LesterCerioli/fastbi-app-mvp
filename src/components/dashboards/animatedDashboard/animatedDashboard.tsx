"use client";

import { useState, useEffect, useCallback } from "react";
import * as S from "./styles";

const COLORS = {
  green: "#22c55e",
  blue: "#38bdf8",
  purple: "#a78bfa",
  orange: "#fb923c",
  pink: "#f472b6",
  teal: "#14b8a6",
};

interface LiveMetrics {
  organization_name: string;
  bars: {
    revenue_percent: number | null;
    customers_percent: number | null;
    orders_percent: number | null;
  };
  growth: {
    mom_growth: number | null;
    daily_growth: number | null;
    vs_previous_percent: number | null;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    confidence: number;
    created_at: string;
  }>;
  kpi_values: Array<{
    code: string;
    name: string;
    actual: number;
    target: number;
    variance: number | null;
    achieved: boolean;
  }>;
}

interface TrafficData {
  total_page_views: number;
  total_unique_visitors: number;
  avg_bounce_rate: number | null;
  avg_session_seconds: number | null;
  dailyTrend: Array<{ metric_date: string; page_views: number }>;
}

interface HealthData {
  services: Array<{
    service_name: string;
    status: string;
    uptime_percent: number | null;
    response_time_ms: number | null;
  }>;
  resources: {
    cpu_usage_percent: number | null;
    memory_usage_percent: number | null;
    disk_usage_percent: number | null;
    network_usage_percent: number | null;
  } | null;
}

function normalizeBars(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => (v / max) * 100);
}

function BarCard({ revPct, usersPct, ordersPct }: { revPct: number | null; usersPct: number | null; ordersPct: number | null }) {
  const rev = revPct ?? 0;
  const users = usersPct ?? 0;
  const orders = ordersPct ?? 0;

  return (
    <S.Card $delay={0} $color={COLORS.green}>
      <S.CardIcon $color={COLORS.green}>📊</S.CardIcon>
      <S.CardTitle>KPI Achievement</S.CardTitle>
      <S.CardSub>Target attainment • live</S.CardSub>
      <S.BarContainer>
        <S.BarRow>
          <S.BarLabel>Rev</S.BarLabel>
          <S.BarTrack>
            <S.BarFill $width={rev} $color={COLORS.green} />
          </S.BarTrack>
          <S.BarValue>{rev}%</S.BarValue>
        </S.BarRow>
        <S.BarRow>
          <S.BarLabel>Users</S.BarLabel>
          <S.BarTrack>
            <S.BarFill $width={users} $color={COLORS.green} />
          </S.BarTrack>
          <S.BarValue>{users}%</S.BarValue>
        </S.BarRow>
        <S.BarRow>
          <S.BarLabel>Orders</S.BarLabel>
          <S.BarTrack>
            <S.BarFill $width={orders} $color={COLORS.green} />
          </S.BarTrack>
          <S.BarValue>{orders}%</S.BarValue>
        </S.BarRow>
      </S.BarContainer>
    </S.Card>
  );
}

function StatCard({ momGrowth }: { momGrowth: number | null }) {
  const mom = momGrowth ?? 0;

  return (
    <S.Card $delay={0.12} $color={COLORS.blue}>
      <S.CardIcon $color={COLORS.blue}>📈</S.CardIcon>
      <S.CardTitle>Growth Metrics</S.CardTitle>
      <S.CardSub>Monthly indicators • live</S.CardSub>
      <div>
        <S.StatRow>
          <S.StatLabel>MoM Growth</S.StatLabel>
          <S.ValueWithChange>
            <S.StatValue $color={COLORS.blue}>{mom > 0 ? "+" : ""}{mom.toFixed(1)}%</S.StatValue>
            <S.ChangeBadge $up={mom > 0}>▲</S.ChangeBadge>
          </S.ValueWithChange>
        </S.StatRow>
      </div>
    </S.Card>
  );
}

function StatusCard({ health }: { health: HealthData | null }) {
  const services = health?.services ?? [];
  const fallback = [
    { label: "API Server", online: false, uptime: null },
    { label: "Database", online: false, uptime: null },
    { label: "Cache Layer", online: false, uptime: null },
    { label: "Queue Worker", online: false, uptime: null },
    { label: "WebSocket", online: false, uptime: null },
  ];
  const rows = services.length > 0
    ? services.map((s) => {
        const labels: Record<string, string> = {
          api_server: "API Server",
          database: "Database",
          cache_layer: "Cache Layer",
          queue_worker: "Queue Worker",
          websocket: "WebSocket",
        };
        return { label: labels[s.service_name] || s.service_name, online: s.status === "online", uptime: s.uptime_percent };
      })
    : fallback;
  const avgUptime = rows.filter((r) => r.uptime != null).length > 0
    ? (rows.filter((r) => r.uptime != null).reduce((acc: number, r) => acc + (r.uptime ?? 0), 0) / rows.filter((r) => r.uptime != null).length).toFixed(2)
    : "—";

  return (
    <S.Card $delay={0.24} $color={COLORS.purple}>
      <S.CardIcon $color={COLORS.purple}>⚡</S.CardIcon>
      <S.CardTitle>System Health</S.CardTitle>
      <S.CardSub>Uptime: <strong>{avgUptime}%</strong></S.CardSub>
      <div>
        {rows.map((s, i) => (
          <S.StatusRow key={i}>
            {s.online ? <S.PulseDot $color={COLORS.green} /> : <S.Spinner $color={COLORS.orange} />}
            {s.label}: {s.online ? "Online" : "Issues"}
          </S.StatusRow>
        ))}
      </div>
    </S.Card>
  );
}

function RevenueCard({ kpiValues }: { kpiValues: LiveMetrics["kpi_values"] }) {
  const revenueKpi = kpiValues?.find((k) => k.code === "revenue" || k.name?.toLowerCase().includes("revenue"));
  const ordersKpi = kpiValues?.find((k) => k.code === "orders" || k.code === "transactions" || k.name?.toLowerCase().includes("order") || k.name?.toLowerCase().includes("transaction"));

  const revenue = revenueKpi?.actual ?? null;
  const orders = ordersKpi?.actual ?? null;
  const aov = revenue != null && orders != null && orders > 0 ? revenue / orders : null;
  const changePct = revenueKpi?.variance != null ? Math.abs(revenueKpi.variance) : null;
  const aovParts = aov != null ? aov.toFixed(2).split(".") : ["45", "00"];

  return (
    <S.Card $delay={0.36} $color={COLORS.orange}>
      <S.CardIcon $color={COLORS.orange}><S.RotatingIcon $color={COLORS.orange}>$</S.RotatingIcon></S.CardIcon>
      <S.CardTitle>Revenue Overview</S.CardTitle>
      <S.CardSub>Live P&L • today</S.CardSub>
      <div>
        <S.DualRow>
          <S.StatLabel>Revenue</S.StatLabel>
          <S.ValueWithChange>
            <S.StatValue $color={COLORS.orange}>${revenue != null ? revenue.toLocaleString() : "—"}</S.StatValue>
            {changePct != null && <S.ChangeBadge $up={true}>+{changePct.toFixed(1)}%</S.ChangeBadge>}
          </S.ValueWithChange>
        </S.DualRow>
        <S.DualRow style={{ padding: "6px 0" }}>
          <S.StatLabel>Orders</S.StatLabel>
          <S.StatValue $color={COLORS.orange}>{orders != null ? orders.toLocaleString() : "—"}</S.StatValue>
        </S.DualRow>
        <S.DualRow>
          <S.StatLabel>AOV</S.StatLabel>
          <S.StatValue $color={COLORS.orange}>${aovParts[0]}.{aovParts[1]}</S.StatValue>
        </S.DualRow>
      </div>
    </S.Card>
  );
}

function TrafficCard({ traffic }: { traffic: TrafficData | null }) {
  const pageviews = traffic?.total_page_views ?? null;
  const bounce = traffic?.avg_bounce_rate ?? null;
  const sessionSeconds = traffic?.avg_session_seconds ?? null;
  const bars = normalizeBars((traffic?.dailyTrend ?? []).map((d) => d.page_views));

  return (
    <S.Card $delay={0.48} $color={COLORS.pink}>
      <S.CardIcon $color={COLORS.pink}>👥</S.CardIcon>
      <S.CardTitle>Traffic Analytics</S.CardTitle>
      <S.CardSub>Real-time visitors • live</S.CardSub>
      <div>
        <S.StatRow>
          <S.StatLabel>Page Views</S.StatLabel>
          <S.StatValue $color={COLORS.pink}>{pageviews != null ? pageviews.toLocaleString() : "—"}</S.StatValue>
        </S.StatRow>
        <S.StatRow>
          <S.StatLabel>Bounce Rate</S.StatLabel>
          <S.StatValue $color={COLORS.pink}>{bounce != null ? `${Number(bounce).toFixed(0)}%` : "—"}</S.StatValue>
        </S.StatRow>
        <S.StatRow>
          <S.StatLabel>Avg. Session</S.StatLabel>
          <S.StatValue $color={COLORS.pink}>{sessionSeconds != null ? `${Math.floor(sessionSeconds / 60)}m ${sessionSeconds % 60}s` : "—"}</S.StatValue>
        </S.StatRow>
      </div>
      {bars.length > 0 && (
        <S.MiniChart>
          {bars.map((h, i) => (
            <S.MiniBar key={i} $h={h} $color={COLORS.pink} $i={i} />
          ))}
        </S.MiniChart>
      )}
    </S.Card>
  );
}

function CpuCard({ health }: { health: HealthData | null }) {
  const r = health?.resources;
  const cpu = r?.cpu_usage_percent ?? 0;
  const mem = r?.memory_usage_percent ?? 0;
  const disk = r?.disk_usage_percent ?? 0;
  const net = r?.network_usage_percent ?? 0;

  return (
    <S.Card $delay={0.6} $color={COLORS.teal}>
      <S.CardIcon $color={COLORS.teal}>🖥️</S.CardIcon>
      <S.CardTitle>Infrastructure</S.CardTitle>
      <S.CardSub>Server resources • live</S.CardSub>
      <S.BarContainer>
        <S.BarRow>
          <S.BarLabel>CPU</S.BarLabel>
          <S.BarTrack><S.BarFill $width={cpu} $color={cpu > 80 ? COLORS.orange : COLORS.teal} /></S.BarTrack>
          <S.BarValue>{cpu}%</S.BarValue>
        </S.BarRow>
        <S.BarRow>
          <S.BarLabel>Mem</S.BarLabel>
          <S.BarTrack><S.BarFill $width={mem} $color={COLORS.teal} /></S.BarTrack>
          <S.BarValue>{mem}%</S.BarValue>
        </S.BarRow>
        <S.BarRow>
          <S.BarLabel>Disk</S.BarLabel>
          <S.BarTrack><S.BarFill $width={disk} $color={COLORS.teal} /></S.BarTrack>
          <S.BarValue>{disk}%</S.BarValue>
        </S.BarRow>
        <S.BarRow>
          <S.BarLabel>Net</S.BarLabel>
          <S.BarTrack><S.BarFill $width={net} $color={COLORS.teal} /></S.BarTrack>
          <S.BarValue>{net}%</S.BarValue>
        </S.BarRow>
      </S.BarContainer>
    </S.Card>
  );
}

function AlertsCard({ items }: { items: LiveMetrics["alerts"] }) {
  const alerts = items.slice(0, 4).map((a) => ({
    text: a.title,
    type: a.severity === "critical" || a.severity === "high" ? "warning" : a.severity === "medium" ? "info" : "success",
  }));

  return (
    <S.Card $delay={0.72} $color={COLORS.orange}>
      <S.CardIcon $color={COLORS.orange}>🔔</S.CardIcon>
      <S.CardTitle>Live Alerts</S.CardTitle>
      <S.CardSub>Real-time notifications</S.CardSub>
      <div>
        {alerts.length > 0 && alerts.map((a, i) => (
          <S.StatusRow key={i}>
            <S.PulseDot $color={a.type === "success" ? COLORS.green : a.type === "warning" ? COLORS.orange : COLORS.blue} />
            {a.text}
          </S.StatusRow>
        ))}
        {alerts.length === 0 && (
          <S.StatusRow>
            <S.PulseDot $color={COLORS.blue} />
            No alerts
          </S.StatusRow>
        )}
      </div>
    </S.Card>
  );
}

function SparklineCard({ traffic }: { traffic: TrafficData | null }) {
  const points = (traffic?.dailyTrend ?? []).slice(-20).map((d) => d.page_views);
  const max = Math.max(...points, 1);

  return (
    <S.Card $delay={0.84} $color={COLORS.blue}>
      <S.CardIcon $color={COLORS.blue}>📉</S.CardIcon>
      <S.CardTitle>Live Sparkline</S.CardTitle>
      <S.CardSub>Rolling 20 data points • real-time</S.CardSub>
      <S.MiniChart style={{ height: 60, gap: 2, marginTop: 6 }}>
        {points.length > 0 && points.map((p, i) => {
          const h = (p / max) * 100;
          return (
            <S.MiniBar
              key={i}
              $h={h}
              $color={COLORS.blue}
              $i={i}
              style={{ width: 6, transition: "height 0.3s ease", animation: "none" }}
            />
          );
        })}
      </S.MiniChart>
      <S.DualRow style={{ marginTop: 8 }}>
        <S.StatLabel>Current</S.StatLabel>
        <S.StatValue $color={COLORS.blue}>{points.length > 0 ? points[points.length - 1].toLocaleString() : "—"}</S.StatValue>
      </S.DualRow>
    </S.Card>
  );
}

async function getFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch { return null; }
}

export default function AnimatedDashboard() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);

  const fetchLiveMetrics = useCallback(async () => {
    const token = await getFreshToken();
    if (!token) return;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers["Authorization"] = `Bearer ${token}`;

    const stored = sessionStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.organization_id) {
          await fetch("/api/session/init", {
            method: "POST",
            headers,
            body: JSON.stringify({ organization_id: user.organization_id }),
          });
        }
      } catch {}
    }

    const r = await fetch("/api/dashboard/live-metrics", { headers });
    if (!r.ok) return;
    const data = await r.json();
    setMetrics(data);

    const org = data.organization_name;
    if (!org) return;

    const qs = new URLSearchParams({ organization_name: org });
    const [trafficRes, healthRes] = await Promise.all([
      fetch(`/api/analytics/traffic?${qs}`, { headers }),
      fetch(`/api/analytics/system-health?${qs}`, { headers }),
    ]);
    if (trafficRes.ok) setTraffic(await trafficRes.json());
    if (healthRes.ok) setHealth(await healthRes.json());
  }, []);

  useEffect(() => {
    fetchLiveMetrics();
  }, [fetchLiveMetrics]);

  useEffect(() => {
    const handler = () => fetchLiveMetrics();
    window.addEventListener("refreshDashboard", handler);
    return () => window.removeEventListener("refreshDashboard", handler);
  }, [fetchLiveMetrics]);

  return (
    <S.Section>
      <S.Header>
        <h2>Live Analytics Overview</h2>
        <p>Real-time dashboard with data from your organization</p>
      </S.Header>
      <S.Grid>
        <BarCard revPct={metrics?.bars?.revenue_percent ?? null} usersPct={metrics?.bars?.customers_percent ?? null} ordersPct={metrics?.bars?.orders_percent ?? null} />
        <StatCard momGrowth={metrics?.growth?.mom_growth ?? null} />
        <StatusCard health={health} />
        <RevenueCard kpiValues={metrics?.kpi_values ?? []} />
        <TrafficCard traffic={traffic} />
        <CpuCard health={health} />
        <AlertsCard items={metrics?.alerts ?? []} />
        <SparklineCard traffic={traffic} />
      </S.Grid>
    </S.Section>
  );
}