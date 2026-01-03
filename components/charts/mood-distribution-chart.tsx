"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface MoodDistributionChartProps {
  data: Record<string, number>;
}

const moodLabels: Record<string, string> = {
  HAPPY: "😊 Happy",
  NEUTRAL: "😐 Neutral",
  STRESSED: "😰 Stressed",
  RELIEVED: "😌 Relieved",
  UNCOMFORTABLE: "😣 Uncomfortable",
};

export function MoodDistributionChart({ data }: MoodDistributionChartProps) {
  const chartData = Object.entries(data ?? {}).map(([key, value]) => ({
    mood: moodLabels[key] ?? key,
    count: value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No mood data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
        <XAxis
          dataKey="mood"
          tick={{ fontSize: 10 }}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="count" fill="url(#moodGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#9333ea" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
