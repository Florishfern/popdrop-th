import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Worker } from "worker_threads";
import { exec } from "child_process";
import os from "os";
import path from "path";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { type, action } = await req.json();
    
    // Ensure ChaosState exists
    let chaosState = await prisma.chaosState.findUnique({ where: { id: "global" } });
    if (!chaosState) {
      chaosState = await prisma.chaosState.create({ data: { id: "global" } });
    }

    if (type === "cpu") {
      if (action === "start") {
        const workerScript = `
          const crypto = require('crypto');
          const start = Date.now();
          // Burn CPU for 60 seconds
          while (Date.now() - start < 60000) {
            crypto.pbkdf2Sync('password', 'salt', 50000, 64, 'sha512');
          }
          require('worker_threads').parentPort.postMessage('done');
        `;
        
        // Spawn multiple workers to max out multi-core systems
        const numCores = os.cpus().length;
        for (let i = 0; i < numCores; i++) {
          new Worker(workerScript, { eval: true });
        }
        
        return NextResponse.json({ message: `Triggered High CPU Load on ${numCores} cores for 60s` });
      }
      return NextResponse.json({ message: "CPU simulation can only be started (auto-stops after 60s)" });
    }

    if (type === "disk-full") {
      const dummyFile = path.join(os.tmpdir(), "chaos-dummy.log");
      if (action === "start") {
        // Run dd command to create a 500MB file (Mac/Linux compatible)
        exec(`dd if=/dev/urandom of=${dummyFile} bs=1m count=500`, (error) => {
          if (error) console.error("Disk Full Error:", error);
        });
        return NextResponse.json({ message: `Writing 500MB dummy file to ${dummyFile} in background` });
      } else {
        exec(`rm -f ${dummyFile}`);
        return NextResponse.json({ message: `Removed dummy file ${dummyFile}` });
      }
    }

    if (type === "freeze") {
      await prisma.chaosState.update({
        where: { id: "global" },
        data: { isAppFrozen: action === "start" }
      });
      return NextResponse.json({ message: action === "start" ? "App Freeze Activated (/api/health will fail)" : "App Freeze Deactivated" });
    }

    if (type === "deface") {
      await prisma.chaosState.update({
        where: { id: "global" },
        data: { isDefaced: action === "start" }
      });
      return NextResponse.json({ message: action === "start" ? "Website Defacement Activated" : "Website Defacement Deactivated" });
    }

    return NextResponse.json({ error: "Unknown chaos type" }, { status: 400 });
  } catch (error) {
    console.error("Chaos API Error:", error);
    return NextResponse.json({ error: "Failed to trigger chaos" }, { status: 500 });
  }
}
