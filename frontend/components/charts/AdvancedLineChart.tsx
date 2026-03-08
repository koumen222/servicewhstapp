"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AdvancedLineChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  gradient?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
}

export function AdvancedLineChart({ 
  data, 
  title, 
  color = "#22c55e", 
  gradient = true,
  height = 300,
  formatValue = (v) => v.toString()
}: AdvancedLineChartProps) {
  const gradientColors = {
    start: color + "40",
    end: color + "00"
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{ 
          background: "var(--card-bg)", 
          borderColor: "var(--card-border)" 
        }}>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-semibold text-white">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = gradient ? AreaChart : LineChart;

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          {gradient ? (
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              fill="url(#colorGradient)"
            />
          ) : (
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
