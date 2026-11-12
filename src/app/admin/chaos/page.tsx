"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Cpu, 
  Snowflake, 
  HardDrive, 
  AlertTriangle, 
  ShieldCheck, 
  TerminalSquare, 
  RefreshCw, 
  Trash2,
  AlertOctagon,
  CheckCircle2
} from "lucide-react";

interface ChaosLogItem {
  id: string;
  type: string;
  action: string;
  message: string;
  details?: string | null;
  createdAt: string;
}

interface ChaosStateResponse {
  id: string;
  isCpuBurning: boolean;
  isDiskFull: boolean;
  isAppFrozen: boolean;
  isDefaced: boolean;
  updatedAt: string;
}

export default function ChaosAdmin() {
  const [logs, setLogs] = useState<ChaosLogItem[]>([]);
  const [chaosState, setChaosState] = useState<Record<string, boolean>>({
    cpu: false,
    freeze: false,
    'disk-full': false,
    deface: false,
  });
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch status from DB
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/chaos/status');
      if (res.ok) {
        const data: ChaosStateResponse = await res.json();
        setChaosState({
          cpu: !!data.isCpuBurning,
          freeze: !!data.isAppFrozen,
          'disk-full': !!data.isDiskFull,
          deface: !!data.isDefaced,
        });
      }
    } catch (err) {
      console.error("Failed to fetch chaos status:", err);
    }
  }, []);

  // Fetch logs from DB
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/chaos/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch chaos logs:", err);
    }
  }, []);

  // Initial load and polling every 3 seconds
  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStatus(), fetchLogs()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClearLogs = async () => {
    if (!confirm("ต้องการลบ Event Logs ทั้งหมดใน Database หรือไม่?")) return;
    try {
      const res = await fetch('/api/v1/chaos/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  const handleToggleChaos = async (type: string) => {
    if (isToggling) return;
    setIsToggling(type);

    const isCurrentlyActive = !!chaosState[type];
    const action = isCurrentlyActive ? "stop" : "start";

    // Optimistic state update
    setChaosState(prev => ({ ...prev, [type]: !isCurrentlyActive }));

    try {
      const res = await fetch('/api/v1/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action }),
      });
      
      // Immediately refetch state and event logs from DB
      await Promise.all([fetchStatus(), fetchLogs()]);
    } catch (error) {
      console.error("Failed to toggle chaos:", error);
      // Revert on error
      await fetchStatus();
    } finally {
      setIsToggling(null);
    }
  };

  const scenarios = [
    { 
      id: 'cpu', 
      label: 'Simulate High CPU Load', 
      desc: 'Auto Scaling Trigger (Multi-core worker burn)', 
      icon: Cpu, 
      color: 'text-orange-500', 
      bg: 'bg-orange-100',
      badge: 'CPU Load'
    },
    { 
      id: 'freeze', 
      label: 'Simulate App Freeze', 
      desc: 'Health Check Failure (/api/health 500)', 
      icon: Snowflake, 
      color: 'text-blue-500', 
      bg: 'bg-blue-100',
      badge: 'Unhealthy'
    },
    { 
      id: 'disk-full', 
      label: 'Simulate Disk Full', 
      desc: 'SSM Auto Remediation (500MB dummy write)', 
      icon: HardDrive, 
      color: 'text-purple-500', 
      bg: 'bg-purple-100',
      badge: 'Disk Full'
    },
    { 
      id: 'deface', 
      label: 'Website Defacement', 
      desc: 'CloudFront Failover / Guard Bot Trigger', 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      bg: 'bg-red-100',
      badge: 'Defaced'
    },
  ];

  const hasActiveChaos = Object.values(chaosState).some(Boolean);
  const activeCount = Object.values(chaosState).filter(Boolean).length;
  const activeScenarios = scenarios.filter(s => chaosState[s.id]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'cpu':
        return { bg: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
      case 'freeze':
        return { bg: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'disk-full':
        return { bg: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      case 'deface':
        return { bg: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
      default:
        return { bg: 'bg-neutral-100 text-neutral-700 border-neutral-200', dot: 'bg-neutral-500' };
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'start':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">START</span>;
      case 'stop':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">STOPPED</span>;
      case 'auto-end':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">NORMALIZED</span>;
      case 'error':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">ERROR</span>;
      default:
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">INFO</span>;
    }
  };

  return (
    <main className="min-h-screen bg-[#f0f2f5] p-4 sm:p-8 font-sans text-neutral-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Back to Application
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-neutral-200 px-3 py-1 rounded-full text-neutral-600">
              SRE Testing Mode
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Status Card (Dynamic based on active chaos) */}
            <div className={`rounded-[2rem] p-6 sm:p-8 text-white shadow-lg transition-all duration-500 flex justify-between items-center ${
              hasActiveChaos 
                ? 'bg-gradient-to-r from-red-600 to-rose-700 shadow-red-600/30' 
                : 'bg-gradient-to-r from-[#4b55f6] to-indigo-600 shadow-blue-600/20'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shrink-0">
                  {hasActiveChaos ? (
                    <AlertOctagon size={32} className="text-white animate-pulse" />
                  ) : (
                    <ShieldCheck size={32} className="text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${hasActiveChaos ? 'bg-amber-300 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
                    <span className="text-sm text-white/90 font-medium">
                      {hasActiveChaos 
                        ? `Chaos Simulation Active (${activeCount} scenario${activeCount > 1 ? 's' : ''})`
                        : "All services stable & healthy"
                      }
                    </span>
                  </div>
                  {hasActiveChaos && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeScenarios.map(s => (
                        <span key={s.id} className="text-[10px] bg-black/30 backdrop-blur-sm text-white px-2 py-0.5 rounded-md font-bold">
                          {s.badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={handleManualRefresh}
                className="bg-black/20 hover:bg-black/30 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                Sync
              </button>
            </div>

            {/* Scenarios Card */}
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Chaos Scenarios</h2>
                  <span className="bg-neutral-100 text-neutral-700 text-xs font-bold px-2 py-0.5 rounded-md">
                    {activeCount} Active / 4 Total
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {scenarios.map((scenario) => {
                  const isActive = !!chaosState[scenario.id];
                  const isPending = isToggling === scenario.id;

                  return (
                    <div key={scenario.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${scenario.bg} ${scenario.color}`}>
                          <scenario.icon size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-black">{scenario.label}</h3>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                                RUNNING
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 font-medium">{scenario.desc}</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button 
                        onClick={() => handleToggleChaos(scenario.id)}
                        disabled={isPending}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 cursor-pointer disabled:opacity-50 ${
                          isActive ? 'bg-red-600' : 'bg-neutral-200'
                        }`}
                        title={isActive ? "Click to Stop" : "Click to Start"}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-300 flex items-center justify-center ${
                          isActive ? 'translate-x-6' : 'translate-x-0'
                        }`}>
                          {isPending && (
                            <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Database Event Logs */}
          <div className="space-y-6 flex flex-col h-full">
            
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col min-h-[550px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <TerminalSquare size={20} className="text-neutral-700" />
                  <h2 className="text-lg font-bold">Database Event Logs</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleManualRefresh}
                    title="Refresh logs from DB"
                    className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} className={`text-neutral-600 ${isRefreshing ? "animate-spin" : ""}`} />
                  </button>
                  <button 
                    onClick={handleClearLogs}
                    title="Clear logs in DB"
                    className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-red-100 hover:text-red-600 text-neutral-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[550px] custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-sm font-medium text-neutral-400 text-center py-16 gap-3">
                    <CheckCircle2 size={32} className="text-neutral-300" />
                    <span>No chaos events recorded in database yet.<br/>Trigger a scenario to begin monitoring.</span>
                  </div>
                ) : (
                  logs.map((log) => {
                    const typeStyle = getTypeStyle(log.type);
                    const timeStr = new Date(log.createdAt).toLocaleTimeString();
                    const dateStr = new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                    return (
                      <div 
                        key={log.id} 
                        className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 flex flex-col gap-1.5 hover:bg-neutral-100/60 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${typeStyle.dot}`}></span>
                            <span className="font-bold uppercase text-[10px] tracking-wider text-neutral-600">{log.type}</span>
                            {getActionBadge(log.action)}
                          </div>
                          <span className="font-mono text-[10px] text-neutral-400">{dateStr} {timeStr}</span>
                        </div>
                        <p className="text-xs font-mono font-medium text-neutral-700 break-words leading-relaxed">
                          {log.message}
                        </p>
                        {log.details && (
                          <p className="text-[10px] font-mono text-neutral-400 bg-white/80 p-1.5 rounded border border-neutral-100">
                            {log.details}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 mt-4 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Persisted in MySQL DB</span>
                <span>{logs.length} Log Entries</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
