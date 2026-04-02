"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { BarChart3 } from 'lucide-react';

const revenueData = [
  { name: '01', revenue: 4000 },
  { name: '05', revenue: 7000 },
  { name: '10', revenue: 5500 },
  { name: '15', revenue: 8000 },
  { name: '20', revenue: 12000 },
  { name: '25', revenue: 10500 },
  { name: '30', revenue: 15400 },
];

const recoveryData = [
  { name: 'Mon', recovered: 45, abandoned: 120 },
  { name: 'Tue', recovered: 55, abandoned: 130 },
  { name: 'Wed', recovered: 60, abandoned: 110 },
  { name: 'Thu', recovered: 40, abandoned: 95 },
  { name: 'Fri', recovered: 80, abandoned: 150 },
  { name: 'Sat', recovered: 95, abandoned: 180 },
  { name: 'Sun', recovered: 70, abandoned: 140 },
];

export default function DashboardCharts() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Revenue Reclaimed Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#34d399]" />
            Revenue Reclaimed
          </h2>
          <select className="bg-[rgba(255,255,255,0.05)] text-xs border border-[rgba(255,255,255,0.1)] rounded-md px-2 py-1 outline-none text-[var(--color-text-secondary)]">
            <option>Last 30 Days</option>
            <option>This Week</option>
          </select>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              <CartesianGrid stroke="#ffffff0a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recoveries vs Abandonment Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7c3aed]" />
            Recoveries vs Lost
          </h2>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recoveryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="#ffffff0a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#888' }} />
              <Bar dataKey="recovered" name="Recovered" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="abandoned" name="Abandoned" fill="#3f3f46" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
