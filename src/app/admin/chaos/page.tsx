"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Snowflake, HardDrive, AlertTriangle } from "lucide-react";
import { simulateChaos } from "@/services/api";

export default function ChaosAdmin() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSimulate = async (type: 'cpu' | 'freeze' | 'disk-full' | 'deface') => {
    setLoading(type);
    try {
      const res = await simulateChaos(type);
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${res.message}`, ...prev]);
    } catch (error) {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Error: ${error}`, ...prev]);
    } finally {
      setLoading(null);
    }
  };

  const chaosActions = [
    { type: 'cpu' as const, label: 'Simulate High CPU Load', icon: Cpu, color: 'text-orange-500', bg: 'bg-orange-500' },
    { type: 'freeze' as const, label: 'Simulate App Freeze', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500' },
    { type: 'disk-full' as const, label: 'Simulate Disk Full', icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500' },
    { type: 'deface' as const, label: 'Simulate Defacement', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500' },
  ];

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#111111] text-white p-6 sm:p-10 font-mono">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors self-start">
          <ArrowLeft size={16} />
          Back to Site
        </Link>

        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-bold text-red-500 uppercase tracking-widest flex items-center gap-3">
            <AlertTriangle size={32} />
            SRE Chaos Control Panel
          </h1>
          <p className="text-neutral-400 text-sm">
            Warning: These actions simulate critical infrastructure failures. Ensure self-healing mechanisms are active.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chaosActions.map(({ type, label, icon: Icon, color, bg }) => (
            <button
              key={type}
              disabled={!!loading}
              onClick={() => handleSimulate(type)}
              className={`flex items-center justify-between p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-all ${loading === type ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-neutral-950 border border-neutral-800 ${color}`}>
                  <Icon size={24} />
                </div>
                <span className="font-bold">{label}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${loading === type ? `${bg} animate-ping` : 'bg-neutral-600'}`}></div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-300">System Logs</h2>
          <div className="bg-black border border-neutral-800 rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-sm flex flex-col gap-2">
            {logs.length === 0 ? (
              <span className="text-neutral-600">Waiting for events...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`${log.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
