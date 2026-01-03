"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TypeDistributionChartProps {
  data: Record<string, number>;
}

const COLORS = ["#9333ea", "#3b82f6", "#ec4899", "#f59e0b"];

const typeLabels: Record<string, string> = {
  NORMAL: "Normal",
  QUICK: "Quick",
  LONG: "Long",
  EMERGENCY: "Emergency",
};

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const chartData = Object.entries(data ?? {}).map(([key, value]) => ({
    name: typeLabels[key] ?? key,
    value: value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Legend
          verticalAlign="top"
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
