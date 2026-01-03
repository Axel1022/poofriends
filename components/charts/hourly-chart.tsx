"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HourlyChartProps {
  data: Record<string, number>;
}

export function HourlyChart({ data }: HourlyChartProps) {
  const chartData = [];
  for (let hour = 0; hour < 24; hour++) {
    chartData.push({
      hour: `${hour}:00`,
      visits: data?.[hour] ?? 0,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 11 }}
          cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
        />
        <Bar dataKey="visits" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9333ea" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
