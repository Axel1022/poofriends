"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DayOfWeekChartProps {
  data: Record<string, number>;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const chartData = dayNames.map((day, index) => ({
    day,
    visits: data?.[index] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10 }}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="visits" fill="url(#dayGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="dayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
