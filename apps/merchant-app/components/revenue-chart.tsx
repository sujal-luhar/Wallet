"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
        >
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
            fontSize={12}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dataPoint = payload[0];
                return (
                  <div className="rounded-none border border-border bg-card px-3 py-2 shadow-md space-y-1 min-w-[120px]">
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {dataPoint.payload.date}
                    </p>
                    <div className="flex items-center justify-between gap-4 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Revenue
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground font-mono">
                        ₹{Number(dataPoint.value).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="revenue" fill="#ca3500" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
