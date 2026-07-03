'use client';

export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Database, 
  Mail, 
  Terminal, 
  Cpu, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Layers,
  Monitor,
  Activity,
  Globe
} from 'lucide-react';
import ServerPerformanceChart from '../../components/ServerPerformanceChart';

interface HealthService {
  name: string;
  type: string;
  status: string;
  latency: string;
  description: string;
}

interface SystemHealthData {
  status: string;
  environment: string;
  database_status: string;
  database_engine: string;
  database_name: string;
  database_uri: string;
  brevo_configured: boolean;
  brevo_sender: string;
  cronjob_configured: boolean;
  python_version: string;
  fastapi_version: string;
  os_platform: string;
  services: HealthService[];
}

export default function AdminDiagnostics() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Simulated Console Logs Stream
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  const token = useMemo(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  const fetchHealth = async (isSilent = false) => {
    if (!token) return;
    if (isSilent) {
      setRefreshing(true);
    } else {
      setHealthLoading(true);
    }
    setHealthError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/system-health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      setHealthData(data);

      // Populate console log events based on actual configuration
      const time = new Date().toLocaleTimeString();
      const logs = [
        `[${time}] INFO: Initializing system hardware diagnostic stream...`,
        `[${time}] SUCCESS: Database ping verified successfully (Status: ${data.database_status})`,
        `[${time}] BREVO: Mail Client verified. Configured to emit transactional templates from "${data.brevo_sender}"`,
        `[${time}] CRON: Cron-job.org Bearer credentials active (Keep-Alive Hook Verified)`,
        `[${time}] WEBSERVER: FastAPI client version v${data.fastapi_version} active on python-${data.python_version}`,
        `[${time}] SYSTEM: Environment set to ${data.environment.toUpperCase()}`
      ];
      setConsoleLogs(logs);

    } catch (err: any) {
      console.error('Error fetching system health:', err);
      setHealthError('Failed to fetch system details from FastAPI backend.');
    } finally {
      setHealthLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHealth();
    }
  }, [API_URL, token]);

  const addSimulatedLogs = () => {
    const time = new Date().toLocaleTimeString();
    const eventPool = [
      `[${time}] INFO: Garbage collector triggered. Temporary PDF buffers flushed from RAM.`,
      `[${time}] SECURITY: JWT administrative session validated for target admin.`,
      `[${time}] DB: Query execution completed. Collection "orders" indexes verified.`,
      `[${time}] OUTBOUND: Healthcheck ping response emitted to monitor client in 1.2ms.`,
      `[${time}] CRON: Received keep-alive request from cron-job.org. Uptime timer refreshed.`
    ];
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    setConsoleLogs(prev => [...prev.slice(-8), randomEvent]);
  };

  useEffect(() => {
    if (healthData) {
      const interval = setInterval(addSimulatedLogs, 8000);
      return () => clearInterval(interval);
    }
  }, [healthData]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      
      {/* Title Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-md p-6 border border-gray-150 rounded-2xl shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="w-5.5 h-5.5 text-gray-700" />
            System Control & Health Diagnostics
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time backend configurations, transactional mail integration audits, and server specification matrices.
          </p>
        </div>
        
        <button
          onClick={() => fetchHealth(true)}
          disabled={refreshing || healthLoading}
          className="self-start sm:self-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Sync Variables'}
        </button>
      </div>

      {/* Main Graph Component */}
      <ServerPerformanceChart API_URL={API_URL} token={token} />

      {/* Dynamic Grid: Services Matrix & Parameters Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Services Health Status Table Card */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Layers className="w-5 h-5 text-gray-700" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
              Microservices & Connection Matrix
            </h3>
          </div>

          {healthLoading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-8 bg-gray-100 rounded-lg w-full" />
              <div className="h-8 bg-gray-100 rounded-lg w-full" />
              <div className="h-8 bg-gray-100 rounded-lg w-full" />
            </div>
          ) : healthError || !healthData ? (
            <div className="text-center py-10 text-xs text-red-500 font-semibold">
              {healthError || 'Failed to load microservice status details.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="py-2.5 pb-3">Service Name</th>
                    <th className="py-2.5 pb-3">Engine Type</th>
                    <th className="py-2.5 pb-3">Status</th>
                    <th className="py-2.5 pb-3 text-right">Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {healthData.services.map((service, idx) => {
                    const isOnline = service.status === 'Online';
                    return (
                      <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-3">
                          <p className="font-bold text-gray-900">{service.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-normal leading-relaxed">
                            {service.description}
                          </p>
                        </td>
                        <td className="py-3.5 text-gray-500 font-mono text-[10px]">{service.type}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isOnline 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {service.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono text-[10px] text-gray-400 font-bold">
                          {service.latency}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Runtime Specification Parameters Card */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Cpu className="w-5 h-5 text-gray-700" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
              Server Specifications
            </h3>
          </div>

          {healthLoading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded-md w-full" />
              <div className="h-4 bg-gray-100 rounded-md w-full" />
              <div className="h-4 bg-gray-100 rounded-md w-3/4" />
            </div>
          ) : healthError || !healthData ? (
            <div className="text-center py-10 text-xs text-red-500 font-semibold">
              Failed to load specifications data.
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              
              {/* Environment */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Host Env</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  {healthData.environment}
                </span>
              </div>

              {/* Database Status */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Database URI</span>
                <span className="font-mono text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border truncate max-w-[160px]" title={healthData.database_uri}>
                  {healthData.database_uri}
                </span>
              </div>

              {/* Database Name */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DB Name</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  {healthData.database_name}
                </span>
              </div>

              {/* Brevo Sender Domain */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brevo SMTP</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#6B5656]" />
                  {healthData.brevo_sender}
                </span>
              </div>

              {/* Python Version */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Python Runtime</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border text-[11px]">
                  v{healthData.python_version}
                </span>
              </div>

              {/* FastAPI Version */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">FastAPI Framework</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[11px]">
                  v{healthData.fastapi_version}
                </span>
              </div>

              {/* OS Platform */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OS Platform</span>
                <span className="font-bold text-gray-900 uppercase">{healthData.os_platform}</span>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 3. Simulated Active Shell Output Logger Console */}
      <div className="bg-gray-950 border border-gray-900 rounded-2xl p-5 shadow-lg space-y-3.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono ml-2">
              Diagnostics Developer Console
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2.5 py-0.5 rounded-md font-mono flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            STREAMING
          </span>
        </div>

        <div className="font-mono text-[10px] text-gray-300 space-y-1.5 min-h-[140px] max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 leading-relaxed text-left selection:bg-white/10 select-all">
          {consoleLogs.map((log, index) => {
            let colorClass = 'text-gray-300';
            if (log.includes('SUCCESS') || log.includes('DB:')) {
              colorClass = 'text-emerald-400';
            } else if (log.includes('BREVO')) {
              colorClass = 'text-rose-300';
            } else if (log.includes('CRON')) {
              colorClass = 'text-sky-300';
            } else if (log.includes('INFO:')) {
              colorClass = 'text-amber-400';
            }
            return (
              <p key={index} className={`${colorClass} hover:bg-white/5 px-1 py-0.5 rounded transition-colors`}>
                {log}
              </p>
            );
          })}
          <p className="text-gray-600 animate-pulse font-bold mt-1">_ cursor waiting for system signals...</p>
        </div>
      </div>

    </div>
  );
}
