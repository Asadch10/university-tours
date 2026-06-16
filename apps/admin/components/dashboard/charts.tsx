'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompact } from '@/lib/utils';

const MAROON = '#7a1a32';
const GOLD = '#cf9526';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #d9d1c8',
  boxShadow: '0 8px 24px -12px rgba(31,26,22,0.25)',
  fontSize: 12,
  padding: '8px 12px',
};

export function RevenueChart({
  data,
}: {
  data: { month: string; gross: number; commission: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gross" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MAROON} stopOpacity={0.28} />
            <stop offset="100%" stopColor={MAROON} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="comm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece8e3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#85725f' }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#85725f' }}
          tickFormatter={(v) => `$${formatCompact(v as number)}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, name) => [`$${(v / 1).toLocaleString()}`, name === 'gross' ? 'Gross' : 'Commission']}
        />
        <Area type="monotone" dataKey="gross" stroke={MAROON} strokeWidth={2.5} fill="url(#gross)" />
        <Area type="monotone" dataKey="commission" stroke={GOLD} strokeWidth={2.5} fill="url(#comm)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Completed: '#2f7d57',
  Upcoming: '#2563a8',
  Requested: '#b4761d',
  Declined: '#9f8e7c',
  Expired: '#bfb2a4',
  Cancelled: '#bd2c4d',
};

export function BookingsBarChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece8e3" vertical={false} />
        <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#85725f' }} interval={0} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#85725f' }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(122,26,50,0.05)' }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? MAROON} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
