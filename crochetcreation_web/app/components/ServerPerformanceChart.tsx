'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle,
  Server
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface LatencyPoint {
  timestamp: string;
  latency: number;
  status: string;
  http_status: number;
}

interface ServerStats {
  current_status: string;
  uptime_percentage: number;
  latency_history: LatencyPoint[];
}

interface ServerPerformanceChartProps {
  API_URL: string;
  token: string | null;
}

export default function ServerPerformanceChart({ API_URL, token }: ServerPerformanceChartProps) {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchStats = async (isSilent = false) => {
    if (!token) return;
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/server-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching server stats:', err);
      setError('Could not connect to server monitoring service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [API_URL, token]);

  const formatXAxis = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return tickItem;
    }
  };

  const averageLatency = stats?.latency_history?.length
    ? Math.round(stats.latency_history.reduce((sum, item) => sum + item.latency, 0) / stats.latency_history.length)
    : 0;

  if (loading) {
    return (
      <div className="bg-white/85 backdrop-blur-md border border-gray-150 rounded-2xl p-6 shadow-sm animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded-md" />
              <div className="h-3 w-32 bg-gray-150 rounded-md" />
            </div>
          </div>
          <div className="h-9 w-9 bg-gray-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-50 rounded-2xl" />
          <div className="h-24 bg-gray-50 rounded-2xl" />
          <div className="h-24 bg-gray-50 rounded-2xl" />
        </div>
        <div className="h-64 bg-gray-50 rounded-2xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white/85 backdrop-blur-md border border-gray-150 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-5 min-h-[350px]">
        <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="max-w-xs space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">Diagnostics Unavailable</h4>
          <p className="text-xs text-gray-500 leading-relaxed">{error || 'Server monitoring statistics are currently offline.'}</p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect Diagnostics
        </button>
      </div>
    );
  }

  const isOnline = stats.current_status === 'Up';

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-150/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      
      {/* Premium Gradient Ambient Light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center shadow-lg shadow-gray-900/10 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2.5">
              System Diagnostics
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                <span className="relative flex h-2 w-2">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                {isOnline ? 'Active' : 'Offline'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Real-time HTTP ping latency logs retrieved from Render</p>
          </div>
        </div>

        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="self-start sm:self-center p-2 text-gray-400 hover:text-gray-900 border border-gray-150 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 shadow-2xs bg-white"
          title="Refresh statistics"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-gray-900' : ''}`} />
        </button>
      </div>

      {/* Upgraded KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-2">
        
        {/* Metric 1: Uptime */}
        <div className="bg-gray-50/40 border border-gray-100 p-5 rounded-2xl flex items-center justify-between group/kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase block">Uptime</span>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{stats.uptime_percentage}%</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-inner group-hover/kpi:-translate-y-1 transition-transform duration-300">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Metric 2: Average Latency */}
        <div className="bg-gray-50/40 border border-gray-100 p-5 rounded-2xl flex items-center justify-between group/kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase block">Avg Response</span>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{averageLatency} ms</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 border border-sky-100/50 flex items-center justify-center shrink-0 shadow-inner group-hover/kpi:-translate-y-1 transition-transform duration-300">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Metric 3: Ping Count */}
        <div className="bg-gray-50/40 border border-gray-100 p-5 rounded-2xl flex items-center justify-between group/kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase block">Total Pings</span>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{stats.latency_history.length} Logs</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-100/50 flex items-center justify-center shrink-0 shadow-inner group-hover/kpi:-translate-y-1 transition-transform duration-300">
            <Activity className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Latency History Chart Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Response Latency Profile</h4>
          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">millisecond scale</span>
        </div>

        <div className="h-64 w-full bg-gray-50/30 border border-gray-150 rounded-2xl p-4 relative">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.latency_history}
                margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis} 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  unit="ms" 
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as LatencyPoint;
                      const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = new Date(data.timestamp).toLocaleDateString();
                      return (
                        <div className="bg-gray-900/90 text-white backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-800 text-[11px] space-y-1.5 min-w-[140px]">
                          <p className="font-semibold text-gray-400 border-b border-gray-800 pb-1">{dateStr} {timeStr}</p>
                          <p className="flex items-center gap-1 font-bold text-sm text-emerald-400">
                            {data.latency} ms
                          </p>
                          <p className="text-gray-405 font-medium flex items-center gap-1">
                            HTTP Status: 
                            <span className={`font-bold ${data.http_status === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {data.http_status}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
          )}
        </div>
      </div>
      
      {/* Information Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        <span>Target: Render Endpoint (/ping)</span>
        <span>Auto-Sync Interval: 5 min</span>
      </div>

    </div>
  );
}
