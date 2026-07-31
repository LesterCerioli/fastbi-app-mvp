"use client";

import { useState, useEffect } from "react";
import * as S from "./styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface BusinessData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
}

const businessTypes = [
  { value: "Automotive", label: "Automotive", color: "#ef4444" },
  { value: "Sales", label: "Sales", color: "#f59e0b" },
  { value: "Pharmaceutical", label: "Pharmaceutical", color: "#10b981" },
  { value: "Educational", label: "Educational", color: "#3b82f6" },
  { value: "Textile", label: "Textile", color: "#8b5cf6" },
  { value: "Services", label: "Services", color: "#ec4899" },
];

const seasonalityTypes = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semester", label: "Semester" },
  { value: "yearly", label: "Yearly" },
];

const generateBusinessData = (selectedType: string): BusinessData[] => {
  const baseValues: Record<string, number> = {
    Automotive: 250000,
    Sales: 180000,
    Pharmaceutical: 120000,
    Educational: 80000,
    Textile: 60000,
    Services: 40000,
  };

  const multiplier = selectedType === "Automotive" ? 1.2 :
                     selectedType === "Sales" ? 1.1 :
                     selectedType === "Pharmaceutical" ? 1.0 :
                     selectedType === "Educational" ? 0.9 :
                     selectedType === "Textile" ? 0.8 : 0.7;

  return businessTypes.map((type) => ({
    name: type.label,
    value: Math.round((baseValues[type.label as keyof typeof baseValues] || 50000) * multiplier),
    color: type.color,
  }));
};

const generateMonthlyData = (seasonality: string): MonthlyData[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const periodCount = seasonality === "weekly" ? 12 :
                      seasonality === "monthly" ? 12 :
                      seasonality === "quarterly" ? 4 :
                      seasonality === "semester" ? 2 : 5;
  
  const data = [];
  for (let i = 0; i < periodCount; i++) {
    const growth = 20000 + Math.random() * 30000 + i * 2000;
    data.push({
      month: months[i % 12],
      revenue: Math.round(growth),
    });
  }
  return data;
};

export default function Dashboard() {
  const [businessType, setBusinessType] = useState("Automotive");
  const [seasonality, setSeasonality] = useState("monthly");
  const [businessData, setBusinessData] = useState<BusinessData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);

  const generateDashboard = () => {
    const newBusinessData = generateBusinessData(businessType);
    setBusinessData(newBusinessData);
    setMonthlyData(generateMonthlyData(seasonality));
    
    const selected = newBusinessData.find(b => b.name === businessType);
    setSelectedBusiness(selected || newBusinessData[0]);
  };

  useEffect(() => {
    generateDashboard();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    return String(value);
  };

  const formatYAxisTick = (value: number): string => {
    return `${(value / 1000).toFixed(0)}k`;
  };

  const totalRevenue = businessData.reduce((sum, item) => sum + item.value, 0);

  return (
    <S.DashboardContainer>
      <S.DashboardTitle>📊 Business Intelligence Dashboard</S.DashboardTitle>
      <S.DashboardSubtitle>
        Visualize business metrics and performance
      </S.DashboardSubtitle>

      <S.FiltersCard>
        <S.FiltersRow>
          <S.FilterGroup>
            <S.FilterLabel>🏢 Business Type</S.FilterLabel>
            <S.FilterSelect
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            >
              {businessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </S.FilterSelect>
          </S.FilterGroup>

          <S.FilterGroup>
            <S.FilterLabel>📅 Seasonality Type</S.FilterLabel>
            <S.FilterSelect
              value={seasonality}
              onChange={(e) => setSeasonality(e.target.value)}
            >
              {seasonalityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </S.FilterSelect>
          </S.FilterGroup>

          <S.FilterGroup>
            <S.FilterButton onClick={generateDashboard}>
              Generate Dashboard
            </S.FilterButton>
          </S.FilterGroup>
        </S.FiltersRow>
      </S.FiltersCard>

      {/* Sales Cards by Business Type */}
      <S.DashboardStatsGrid>
        {businessData.slice(0, 4).map((item, index) => (
          <S.DashboardStatCard key={index} color={item.color}>
            <S.DashboardStatValue>{formatCurrency(item.value)}</S.DashboardStatValue>
            <S.DashboardStatLabel>{item.name}</S.DashboardStatLabel>
          </S.DashboardStatCard>
        ))}
      </S.DashboardStatsGrid>

      {/* Business Distribution */}
      <S.ChartCard>
        <S.DashboardSectionTitle>🎯 Business Distribution</S.DashboardSectionTitle>
        <S.BusinessDistribution>
          <S.PieChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={businessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {businessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatTooltipValue(value)}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </S.PieChartWrapper>

          <S.LegendList>
            {businessData.map((item, index) => {
              const percentage = ((item.value / totalRevenue) * 100).toFixed(0);
              return (
                <S.LegendItem key={index}>
                  <S.LegendColor color={item.color} />
                  <span>{item.name}</span>
                  <S.LegendPercentage>{percentage}%</S.LegendPercentage>
                </S.LegendItem>
              );
            })}
          </S.LegendList>
        </S.BusinessDistribution>
      </S.ChartCard>

      {/* Monthly Growth */}
      <S.ChartCard>
        <S.DashboardSectionTitle>📈 Monthly Growth</S.DashboardSectionTitle>
        <S.BarChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                formatter={(value: any) => formatTooltipValue(value)}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="#22c55e"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </S.BarChartWrapper>
      </S.ChartCard>

      {/* Growth Trend */}
      <S.ChartCard>
        <S.DashboardSectionTitle>📉 Growth Trend</S.DashboardSectionTitle>
        <S.ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: "#94a3b8" }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                formatter={(value: any) => formatTooltipValue(value)}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </S.ChartContainer>
      </S.ChartCard>
    </S.DashboardContainer>
  );
}