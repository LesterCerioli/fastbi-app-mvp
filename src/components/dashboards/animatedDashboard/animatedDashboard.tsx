"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as S from "./styles";

const COLORS = {
  green: "#22c55e",
  blue: "#38bdf8",
  purple: "#a78bfa",
  orange: "#fb923c",
  pink: "#f472b6",
  teal: "#14b8a6",
};

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface LiveMetrics {
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
    variance: number;
    achieved: boolean;
  }>;
}

function useLiveValue(initial: number, min: number, max: number, intervalMs: number) {
  const [value, setValue] = useState(initial);
  const targetRef = useRef(initial);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const id = setInterval(() => {
      targetRef.current = randomBetween(min, max);
    }, intervalMs);
    return () => clearInterval(id);
  }, [min, max, intervalMs]);

  useEffect(() => {
    function step() {
      setValue((prev) => {
        const target = targetRef.current;
        if (prev === target) return prev;
        const diff = Math.abs(target - prev);
        const step = Math.max(1, Math.ceil(diff / 6));
        if (prev < target) return Math.min(prev + step, target);
        return Math.max(prev - step, target);
      });
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return value;
}

function BarCard({ index, revPct, usersPct, ordersPct }: { index: number; revPct: number | null; usersPct: number | null; ordersPct: number | null }) {
  const rev = useLiveValue(revPct ?? 85, 55, 100, 1800);
  const users = useLiveValue(usersPct ?? 72, 40, 98, 2200);
  const orders = useLiveValue(ordersPct ?? 93, 65, 100, 1500);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.green}>
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
      <S.MiniChart>
        {Array.from({ length: 16 }, (_, i) => (
          <S.MiniBar key={i} $h={randomBetween(20, 100)} $color={COLORS.green} $i={i} />
        ))}
      </S.MiniChart>
    </S.Card>
  );
}

function StatCard({ index, momGrowth }: { index: number; momGrowth: number | null }) {
  const mom = useLiveValue(momGrowth ?? 18, Math.max(5, (momGrowth ?? 18) - 10), (momGrowth ?? 18) + 15, 2500);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.blue}>
      <S.CardIcon $color={COLORS.blue}>📈</S.CardIcon>
      <S.CardTitle>Growth Metrics</S.CardTitle>
      <S.CardSub>Monthly indicators • live</S.CardSub>
      <div>
        <S.StatRow>
          <S.StatLabel>MoM Growth</S.StatLabel>
          <S.ValueWithChange>
            <S.StatValue $color={COLORS.blue}>+{mom.toFixed(1)}%</S.StatValue>
            <S.ChangeBadge $up={mom > 0}>▲</S.ChangeBadge>
          </S.ValueWithChange>
        </S.StatRow>
      </div>
      <S.MiniChart>
        {Array.from({ length: 16 }, (_, i) => (
          <S.MiniBar key={i} $h={randomBetween(30, 100)} $color={COLORS.blue} $i={i} />
        ))}
      </S.MiniChart>
    </S.Card>
  );
}

function StatusCard({ index }: { index: number }) {
  const [services] = useState([
    { label: "API Server", online: true },
    { label: "Database", online: true },
    { label: "Cache Layer", online: true },
    { label: "Queue Worker", online: false },
    { label: "WebSocket", online: true },
  ]);

  const uptime = useLiveValue(99, 96, 100, 5000);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.purple}>
      <S.CardIcon $color={COLORS.purple}>⚡</S.CardIcon>
      <S.CardTitle>System Health</S.CardTitle>
      <S.CardSub>Uptime: <strong>{uptime}.{randomBetween(0, 9)}%</strong></S.CardSub>
      <div>
        {services.map((s, i) => (
          <S.StatusRow key={i}>
            {s.online ? <S.PulseDot $color={COLORS.green} /> : <S.Spinner $color={COLORS.orange} />}
            {s.label}: {s.online ? "Online" : "Issues"}
          </S.StatusRow>
        ))}
      </div>
    </S.Card>
  );
}

function RevenueCard({ index, kpiValues }: { index: number; kpiValues: LiveMetrics["kpi_values"] }) {
  const revenueKpi = kpiValues?.find(k => k.code === "revenue" || k.name?.toLowerCase().includes("revenue"));
  const ordersKpi = kpiValues?.find(k => k.code === "orders" || k.code === "transactions" || k.name?.toLowerCase().includes("order") || k.name?.toLowerCase().includes("transaction"));

  const revInitial = revenueKpi ? Math.round(revenueKpi.actual / 1000) : 124;
  const ordInitial = ordersKpi ? Math.round(ordersKpi.actual) : 340;
  const aovInitial = revenueKpi && ordersKpi ? Math.round((revenueKpi.actual / ordersKpi.actual) * 100) / 100 : 45;

  const revenue = useLiveValue(revInitial, Math.max(50, revInitial - 40), revInitial + 50, 2000);
  const orders = useLiveValue(ordInitial, Math.max(50, ordInitial - 140), ordInitial + 160, 2500);
  const aov = useLiveValue(aovInitial, Math.max(10, aovInitial - 15), aovInitial + 15, 3000);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.orange}>
      <S.CardIcon $color={COLORS.orange}><S.RotatingIcon $color={COLORS.orange}>$</S.RotatingIcon></S.CardIcon>
      <S.CardTitle>Revenue Overview</S.CardTitle>
      <S.CardSub>Live P&L • today</S.CardSub>
      <div>
        <S.DualRow>
          <S.StatLabel>Revenue</S.StatLabel>
          <S.ValueWithChange>
            <S.StatValue $color={COLORS.orange}>${revenue}K</S.StatValue>
            <S.ChangeBadge $up={revenue > revInitial}>+{randomBetween(2, 8)}%</S.ChangeBadge>
          </S.ValueWithChange>
        </S.DualRow>
        <S.DualRow style={{ padding: "6px 0" }}>
          <S.StatLabel>Orders</S.StatLabel>
          <S.StatValue $color={COLORS.orange}>{orders}</S.StatValue>
        </S.DualRow>
        <S.DualRow>
          <S.StatLabel>AOV</S.StatLabel>
          <S.StatValue $color={COLORS.orange}>${aov}.{randomBetween(0, 99)}</S.StatValue>
        </S.DualRow>
      </div>
      <S.MiniChart>
        {Array.from({ length: 16 }, (_, i) => (
          <S.MiniBar key={i} $h={randomBetween(25, 100)} $color={COLORS.orange} $i={i} />
        ))}
      </S.MiniChart>
    </S.Card>
  );
}

function TrafficCard({ index }: { index: number }) {
  const pageviews = useLiveValue(4500, 2000, 8000, 1800);
  const bounce = useLiveValue(32, 15, 55, 2200);
  const duration = useLiveValue(4, 1, 8, 3000);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.pink}>
      <S.CardIcon $color={COLORS.pink}>👥</S.CardIcon>
      <S.CardTitle>Traffic Analytics</S.CardTitle>
      <S.CardSub>Real-time visitors • live</S.CardSub>
      <div>
        <S.StatRow>
          <S.StatLabel>Page Views</S.StatLabel>
          <S.StatValue $color={COLORS.pink}>{pageviews.toLocaleString()}</S.StatValue>
        </S.StatRow>
        <S.StatRow>
          <S.StatLabel>Bounce Rate</S.StatLabel>
          <S.StatValue $color={COLORS.pink}>{bounce}%</S.StatValue>
        </S.StatRow>
        <S.StatRow>
          <S.StatLabel>Avg. Session</S.StatLabel>
          <S.StatValue $color={COLORS.pink}>{duration}m {randomBetween(10, 59)}s</S.StatValue>
        </S.StatRow>
      </div>
      <S.MiniChart>
        {Array.from({ length: 16 }, (_, i) => (
          <S.MiniBar key={i} $h={randomBetween(15, 100)} $color={COLORS.pink} $i={i} />
        ))}
      </S.MiniChart>
    </S.Card>
  );
}

function CpuCard({ index }: { index: number }) {
  const cpu = useLiveValue(45, 10, 95, 800);
  const mem = useLiveValue(62, 30, 90, 1200);
  const disk = useLiveValue(78, 50, 95, 3000);
  const net = useLiveValue(55, 20, 85, 1500);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.teal}>
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

function AlertsCard({ index, items }: { index: number; items: LiveMetrics["alerts"] }) {
  const [alerts, setAlerts] = useState<{ text: string; type: "success" | "warning" | "info" }[]>(
    items.length > 0
      ? items.slice(0, 4).map(a => ({
          text: a.title,
          type: a.severity === "critical" || a.severity === "high" ? "warning" : a.severity === "medium" ? "info" : "success",
        }))
      : [
          { text: "Q4 revenue target exceeded", type: "success" },
          { text: "New user signups +24% MoM", type: "success" },
          { text: "API latency spike detected", type: "warning" },
          { text: "Cache hit ratio dropped", type: "warning" },
        ]
  );

  useEffect(() => {
    if (items.length === 0) {
      const types = ["success", "warning", "info"] as const;
      const messages = [
        "New record: daily active users",
        "Database replication lag normal",
        "Sales conversion rate improving",
        "Memory usage trending up",
        "CDN cache hit rate 94%",
        "Background job queue cleared",
        "SSL certificate renewing soon",
        "Load balancer health check passed",
      ];
      const id = setInterval(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        setAlerts((prev) => [{ text: msg, type }, ...prev.slice(0, 3)]);
      }, 4000);
      return () => clearInterval(id);
    }
  }, [items]);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.orange}>
      <S.CardIcon $color={COLORS.orange}>🔔</S.CardIcon>
      <S.CardTitle>Live Alerts</S.CardTitle>
      <S.CardSub>Real-time notifications</S.CardSub>
      <div>
        {alerts.map((a, i) => (
          <S.StatusRow key={i}>
            <S.PulseDot $color={a.type === "success" ? COLORS.green : a.type === "warning" ? COLORS.orange : COLORS.blue} />
            {a.text}
          </S.StatusRow>
        ))}
      </div>
    </S.Card>
  );
}

function SparklineCard({ index }: { index: number }) {
  const [points, setPoints] = useState(() =>
    Array.from({ length: 20 }, () => randomBetween(20, 100))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setPoints((prev) => [...prev.slice(1), randomBetween(20, 100)]);
    }, 600);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(...points);
  const min = Math.min(...points);

  return (
    <S.Card $delay={index * 0.12} $color={COLORS.blue}>
      <S.CardIcon $color={COLORS.blue}>📉</S.CardIcon>
      <S.CardTitle>Live Sparkline</S.CardTitle>
      <S.CardSub>Rolling 20 data points • real-time</S.CardSub>
      <S.MiniChart style={{ height: 60, gap: 2, marginTop: 6 }}>
        {points.map((p, i) => {
          const h = ((p - min) / (max - min || 1)) * 100;
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
        <S.StatValue $color={COLORS.blue}>{points[points.length - 1]}</S.StatValue>
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
    if (r.ok) setMetrics(await r.json());
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
        <p>Real-time animated dashboard with dynamic data simulation</p>
      </S.Header>
      <S.Grid>
        <BarCard index={0} revPct={metrics?.bars?.revenue_percent ?? null} usersPct={metrics?.bars?.customers_percent ?? null} ordersPct={metrics?.bars?.orders_percent ?? null} />
        <StatCard index={1} momGrowth={metrics?.growth?.mom_growth ?? null} />
        <StatusCard index={2} />
        <RevenueCard index={3} kpiValues={metrics?.kpi_values ?? []} />
        <TrafficCard index={4} />
        <CpuCard index={5} />
        <AlertsCard index={6} items={metrics?.alerts ?? []} />
        <SparklineCard index={7} />
      </S.Grid>
    </S.Section>
  );
}
