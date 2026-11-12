import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Worker } from "worker_threads";
import fs from "fs";
import os from "os";
import path from "path";

export const dynamic = 'force-dynamic';

// Global reference to active CPU workers & auto-stop timeout
declare global {
  var __chaosCpuWorkers: Worker[] | undefined;
  var __chaosCpuTimeout: NodeJS.Timeout | undefined;
}

const DUMMY_DISK_FILE = path.join(os.tmpdir(), "chaos-dummy.log");

async function recordLog(type: string, action: string, message: string, details?: string) {
  try {
    await prisma.chaosEventLog.create({
      data: {
        type,
        action,
        message,
        details: details || null,
      },
    });
  } catch (err) {
    console.error("Failed to record chaos event log:", err);
  }
}

export async function POST(req: Request) {
  try {
    const { type, action } = await req.json();
    
    // Ensure ChaosState exists
    let chaosState = await prisma.chaosState.findUnique({ where: { id: "global" } });
    if (!chaosState) {
      chaosState = await prisma.chaosState.create({ data: { id: "global" } });
    }

    // 1. HIGH CPU LOAD SCENARIO
    if (type === "cpu") {
      if (action === "start") {
        // Terminate any previous workers first
        if (global.__chaosCpuWorkers && global.__chaosCpuWorkers.length > 0) {
          global.__chaosCpuWorkers.forEach(w => {
            try { w.terminate(); } catch {}
          });
        }
        if (global.__chaosCpuTimeout) {
          clearTimeout(global.__chaosCpuTimeout);
        }

        const workerScript = `
          const crypto = require('crypto');
          const start = Date.now();
          // Burn CPU for up to 60 seconds
          while (Date.now() - start < 60000) {
            crypto.pbkdf2Sync('password', 'salt', 50000, 64, 'sha512');
          }
          require('worker_threads').parentPort.postMessage('done');
        `;
        
        const numCores = Math.max(1, os.cpus().length);
        const workers: Worker[] = [];
        for (let i = 0; i < numCores; i++) {
          try {
            const w = new Worker(workerScript, { eval: true });
            w.on('error', (err) => console.error("CPU Worker error:", err));
            workers.push(w);
          } catch (e) {
            console.error("Failed to spawn CPU worker:", e);
          }
        }
        global.__chaosCpuWorkers = workers;

        await prisma.chaosState.update({
          where: { id: "global" },
          data: { isCpuBurning: true }
        });

        const msg = `Triggered High CPU Load on ${numCores} cores (Auto-Scaling alarm test for 60s)`;
        await recordLog("cpu", "start", msg, `Cores: ${numCores}, Duration: 60s`);

        // Auto-stop after 60 seconds
        global.__chaosCpuTimeout = setTimeout(async () => {
          if (global.__chaosCpuWorkers) {
            global.__chaosCpuWorkers.forEach(w => {
              try { w.terminate(); } catch {}
            });
            global.__chaosCpuWorkers = [];
          }
          try {
            await prisma.chaosState.update({
              where: { id: "global" },
              data: { isCpuBurning: false }
            });
            await recordLog("cpu", "auto-end", "High CPU simulation finished automatically (60s elapsed). CPU load normalized.");
          } catch {}
        }, 60000);

        return NextResponse.json({ message: msg });
      } else {
        // Stop CPU simulation immediately
        if (global.__chaosCpuWorkers) {
          global.__chaosCpuWorkers.forEach(w => {
            try { w.terminate(); } catch {}
          });
          global.__chaosCpuWorkers = [];
        }
        if (global.__chaosCpuTimeout) {
          clearTimeout(global.__chaosCpuTimeout);
          global.__chaosCpuTimeout = undefined;
        }

        await prisma.chaosState.update({
          where: { id: "global" },
          data: { isCpuBurning: false }
        });

        const msg = "High CPU simulation stopped manually by operator";
        await recordLog("cpu", "stop", msg);
        return NextResponse.json({ message: msg });
      }
    }

    // 2. DISK FULL SCENARIO
    if (type === "disk-full") {
      if (action === "start") {
        try {
          // Create a 500MB dummy file fast using fs.openSync + write
          // Write in 10MB chunks for safety and speed
          const chunkSize = 10 * 1024 * 1024; // 10MB
          const chunk = Buffer.alloc(chunkSize, 0x41); // 'A'
          const fd = fs.openSync(DUMMY_DISK_FILE, 'w');
          for (let i = 0; i < 50; i++) { // 50 * 10MB = 500MB
            fs.writeSync(fd, chunk);
          }
          fs.closeSync(fd);
        } catch (err: any) {
          console.error("Failed to write dummy disk file:", err);
        }

        await prisma.chaosState.update({
          where: { id: "global" },
          data: { isDiskFull: true }
        });

        const msg = `Allocated 500MB dummy file at ${DUMMY_DISK_FILE} to test SSM Auto-Remediation`;
        await recordLog("disk-full", "start", msg, `File: ${DUMMY_DISK_FILE}, Size: 500MB`);
        return NextResponse.json({ message: msg });
      } else {
        try {
          if (fs.existsSync(DUMMY_DISK_FILE)) {
            fs.unlinkSync(DUMMY_DISK_FILE);
          }
        } catch (err: any) {
          console.error("Failed to delete dummy disk file:", err);
        }

        await prisma.chaosState.update({
          where: { id: "global" },
          data: { isDiskFull: false }
        });

        const msg = `Removed 500MB dummy file from ${DUMMY_DISK_FILE}. Disk space restored.`;
        await recordLog("disk-full", "stop", msg);
        return NextResponse.json({ message: msg });
      }
    }

    // 3. APP FREEZE SCENARIO
    if (type === "freeze") {
      const isStart = action === "start";
      await prisma.chaosState.update({
        where: { id: "global" },
        data: { isAppFrozen: isStart }
      });

      const msg = isStart
        ? "App Freeze Activated: /api/health now returns 500 Unhealthy to trigger ALB Target Draining"
        : "App Freeze Deactivated: /api/health restored to 200 Healthy";
      
      await recordLog("freeze", isStart ? "start" : "stop", msg);
      return NextResponse.json({ message: msg });
    }

    // 4. WEBSITE DEFACEMENT SCENARIO
    if (type === "deface") {
      const isStart = action === "start";
      await prisma.chaosState.update({
        where: { id: "global" },
        data: { isDefaced: isStart }
      });

      // On-Demand Chaos: Dispatch Canary Guard Bot
      let canaryDispatched = false;
      if (isStart && process.env.TRIGGER_CANARY_URL) {
        try {
          fetch(process.env.TRIGGER_CANARY_URL, { method: "POST" })
            .then(async (res) => {
              if (res.ok) {
                await recordLog("deface", "info", "Canary Guard Bot dispatched and verified detection of incident");
              }
            })
            .catch((err) => {
              console.warn("Trigger canary call failed:", err.message);
            });
          canaryDispatched = true;
        } catch (err: any) {
          console.warn("Trigger canary exception:", err.message);
        }
      }

      const msg = isStart
        ? `Website Defacement Activated (CloudFront Failover simulated${canaryDispatched ? ", Guard Bot Dispatched" : ""})`
        : "Website Defacement Deactivated: System normal";

      await recordLog("deface", isStart ? "start" : "stop", msg);
      return NextResponse.json({ message: msg });
    }

    return NextResponse.json({ error: "Unknown chaos type" }, { status: 400 });
  } catch (error: any) {
    console.error("Chaos API Error:", error);
    await recordLog("system", "error", `Chaos execution error: ${error?.message || "Unknown"}`);
    return NextResponse.json({ error: "Failed to trigger chaos" }, { status: 500 });
  }
}
