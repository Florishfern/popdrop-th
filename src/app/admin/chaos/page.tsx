"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Snowflake, HardDrive, AlertTriangle, ShieldCheck, Activity, TerminalSquare, RefreshCw } from "lucide-react";

export default function ChaosAdmin() {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeChaos, setActiveChaos] = useState<string | null>(null);

  // Poll for chaos status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/v1/chaos/status');
        if (res.ok) {
          const data = await res.json();
          // Decide which one is active for UI (simplification: we just show one active in dial, but toggles can be multiple)
          if (data.isDefaced) setActiveChaos('deface');
          else if (data.isAppFrozen) setActiveChaos('freeze');
          // For CPU and Disk, they are transient/background so we might not have a boolean flag in DB. 
          // We can just rely on local state for them during the 60s demo.
        }
      } catch (err) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load logs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chaosLogs');
    if (saved) {
      setLogs(JSON.parse(saved));
    }
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [msg, ...prev].slice(0, 50); // Keep last 50 logs
      localStorage.setItem('chaosLogs', JSON.stringify(newLogs));
      return newLogs;
    });
  };

  const handleToggleChaos = async (type: string) => {
    const isActivating = activeChaos !== type;
    const action = isActivating ? "start" : "stop";

    // Optimistic UI update
    if (isActivating) {
      setActiveChaos(type);
      addLog(`[${new Date().toLocaleTimeString()}] Triggered ${type} simulation...`);
    } else {
      setActiveChaos(null);
      addLog(`[${new Date().toLocaleTimeString()}] Stopping ${type} simulation...`);
    }
    
    try {
      const res = await fetch('/api/v1/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action })
      });
      const data = await res.json();
      
      if (res.ok) {
        addLog(`[${new Date().toLocaleTimeString()}] ${data.message}`);
        // If it's CPU, it auto stops after 60s
        if (type === 'cpu' && action === 'start') {
          setTimeout(() => {
            setActiveChaos(null);
            addLog(`[${new Date().toLocaleTimeString()}] High CPU simulation ended automatically.`);
          }, 60000);
        }
      } else {
        addLog(`[${new Date().toLocaleTimeString()}] Error: ${data.error}`);
        setActiveChaos(null); // Revert
      }
    } catch (error) {
      addLog(`[${new Date().toLocaleTimeString()}] Error: Failed to reach API`);
      setActiveChaos(null);
    }
  };

  const scenarios = [
    { id: 'cpu', label: 'Simulate High CPU Load', desc: 'Auto Scaling Trigger', icon: Cpu, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'freeze', label: 'Simulate App Freeze', desc: 'Health Check Failure', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'disk-full', label: 'Simulate Disk Full', desc: 'SSM Auto Remediation', icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'deface', label: 'Website Defacement', desc: 'WAF / Middleware Test', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2f5] p-4 sm:p-8 font-sans text-neutral-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Back to Application
          </Link>
          <span className="text-xs font-bold bg-neutral-200 px-3 py-1 rounded-full text-neutral-600">SRE Testing Mode</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Blue Status Card */}
            <div className="bg-[#4b55f6] rounded-[2rem] p-6 sm:p-8 text-white shadow-lg shadow-blue-600/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <ShieldCheck size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-sm text-blue-100 font-medium">All services stable</span>
                  </div>
                </div>
              </div>
              <button className="bg-black/20 hover:bg-black/30 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors backdrop-blur-md">
                View Architecture
              </button>
            </div>

            {/* Scenarios Card (Like "Schedule" in the image) */}
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Chaos Scenarios</h2>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-md">4</span>
                </div>
                <button className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <MoreHorizontalIcon />
                </button>
              </div>

              <div className="space-y-6">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${scenario.bg} ${scenario.color}`}>
                        <scenario.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-black">{scenario.label}</h3>
                        <p className="text-sm text-neutral-400 font-medium">{scenario.desc}</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => handleToggleChaos(scenario.id)}
                      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${activeChaos === scenario.id ? 'bg-black' : 'bg-neutral-200'}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${activeChaos === scenario.id ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6 flex flex-col h-full">
            
            {/* Target Resources (Like "Devices" in the image) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <TerminalSquare size={20} className="text-neutral-700" />
                  <h2 className="text-lg font-bold">Event Logs</h2>
                </div>
                <button 
                  onClick={() => {
                    setLogs([]);
                    localStorage.removeItem('chaosLogs');
                  }}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  <RefreshCw size={14} className="text-neutral-500" />
                </button>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm font-medium text-neutral-400 text-center">
                    No chaos events triggered yet.<br/>System is operating normally.
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <p className="text-xs font-mono font-medium text-neutral-600 break-words">{log}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  );
}
