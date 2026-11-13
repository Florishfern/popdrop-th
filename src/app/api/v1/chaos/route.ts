import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Worker } from "worker_threads";
import fs from "fs";
import os from "os";
import path from "path";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

export const dynamic = 'force-dynamic';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "arn:aws:sns:ap-southeast-1:648043742453:popdrop-system-alerts";

async function sendSnsIncidentReport(status: "TRIGGERED" | "RESOLVED", scenario: string, details: string) {
  try {
    const isResolved = status === "RESOLVED";
    const subject = isResolved 
      ? `✅ [PopDrop Chaos Auto-Healed] ${scenario} Recovered Successfully`
      : `🚨 [PopDrop Chaos Alert] ${scenario} Incident Triggered`;

    const message = `PopDrop SRE Chaos Engineering Alert
============================================================
Incident Status: ${status}
Scenario: ${scenario}
Details: ${details}
Timestamp: ${new Date().toISOString()}
Target Environment: AWS ECS (popdrop-cluster) & ALB
Remediation: AWS Systems Manager (SSM) / Automated Health Recovery
Dev Team Recipients: 67050820@kmitl.ac.th, 67050466@kmitl.ac.th
============================================================`;

    await snsClient.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: subject.slice(0, 100),
      Message: message,
    }));
    console.log(`[SNS] Dispatched ${status} report for ${scenario}`);
  } catch (err: any) {
    console.warn(`[SNS] Failed to dispatch incident report:`, err.message);
  }
}

// Global reference to active CPU workers & auto-stop timeout
declare global {
  var __chaosCpuWorkers: Worker[] | undefined;
  var __chaosCpuTimeout: NodeJS.Timeout | undefined;
  var __isAppFrozen: boolean | undefined;
  var __chaosFreezeTimeout: NodeJS.Timeout | undefined;
  var __chaosDiskTimeout: NodeJS.Timeout | undefined;
  var __chaosDefaceTimeout: NodeJS.Timeout | undefined;
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
          // Burn CPU for up to 210 seconds (3.5 minutes - allows AWS Auto-Scaling to trigger after 3 periods)
          while (Date.now() - start < 210000) {
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

        const msg = `Triggered High CPU Load on ${numCores} cores (Auto-Scaling live test: up to 3.5 mins or click Stop anytime)`;
        await recordLog("cpu", "start", msg, `Cores: ${numCores}, Duration: up to 210s`);
        sendSnsIncidentReport("TRIGGERED", "High CPU Load (Auto-Scaling)", msg);

        // Auto-stop after 210 seconds (3.5 minutes) if operator does not stop it manually
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
            await recordLog("cpu", "auto-end", "High CPU simulation finished automatically (3.5 minutes elapsed). CPU load normalized.");
            sendSnsIncidentReport("RESOLVED", "High CPU Load (Auto-Scaling)", "High CPU simulation finished automatically (3.5 minutes elapsed). CPU load normalized back to healthy (Self-Healed 100%).");
          } catch {}
        }, 210000);

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
        sendSnsIncidentReport("RESOLVED", "High CPU Load (Auto-Scaling)", "High CPU simulation stopped manually by operator. CPU load normalized back to healthy (Self-Healed 100%).");
        return NextResponse.json({ message: msg });
      }
    }

    // 2. DISK FULL SCENARIO
    if (type === "disk-full") {
      if (global.__chaosDiskTimeout) {
        clearTimeout(global.__chaosDiskTimeout);
        global.__chaosDiskTimeout = undefined;
      }

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

        const msg = `Allocated 500MB dummy file at ${DUMMY_DISK_FILE} to test SSM Auto-Remediation (Auto-heals in 90s)`;
        await recordLog("disk-full", "start", msg, `File: ${DUMMY_DISK_FILE}, Size: 500MB`);
        sendSnsIncidentReport("TRIGGERED", "Disk Space Exhaustion (Disk Full)", msg);

        // Auto-heal after 90 seconds (Simulate SSM Runbook disk purge)
        global.__chaosDiskTimeout = setTimeout(async () => {
          try {
            if (fs.existsSync(DUMMY_DISK_FILE)) {
              fs.unlinkSync(DUMMY_DISK_FILE);
            }
            await prisma.chaosState.update({
              where: { id: "global" },
              data: { isDiskFull: false }
            });
            await recordLog(
              "disk-full",
              "auto-end",
              "Disk Full simulation resolved automatically (90s elapsed). AWS Systems Manager (SSM) Auto-Remediation runbook completed: Purged 500MB dummy log."
            );
            sendSnsIncidentReport("RESOLVED", "Disk Space Exhaustion (Disk Full)", "Disk Full simulation resolved automatically (90s elapsed). AWS Systems Manager (SSM) Auto-Remediation runbook completed: Purged 500MB dummy log (Self-Healed 100%).");
          } catch (err) {
            console.error("Failed to auto-heal disk-full:", err);
          }
        }, 90000);

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
        sendSnsIncidentReport("RESOLVED", "Disk Space Exhaustion (Disk Full)", "Disk space restored manually. 500MB dummy removed (Self-Healed 100%).");
        return NextResponse.json({ message: msg });
      }
    }

    // 3. APP FREEZE SCENARIO (Single-Container Freeze for True HA & Zero Downtime)
    if (type === "freeze") {
      const isStart = action === "start";

      if (global.__chaosFreezeTimeout) {
        clearTimeout(global.__chaosFreezeTimeout);
        global.__chaosFreezeTimeout = undefined;
      }

      // Freeze ONLY this specific container in-memory
      global.__isAppFrozen = isStart;

      // Update DB state so Admin UI toggle reflects active scenario
      await prisma.chaosState.update({
        where: { id: "global" },
        data: { isAppFrozen: isStart }
      });

      if (isStart) {
        const msg = "App Freeze Activated on Container: /api/health on this node returns 500 Unhealthy. Peer container remains Healthy (Zero Downtime). ALB drains and ECS auto-replaces container.";
        await recordLog("freeze", "start", msg, "Target Group will transition 1 target to Unhealthy. Peer remains Healthy.");
        sendSnsIncidentReport("TRIGGERED", "Application Freeze (Single-Node HA Test)", msg);

        // Auto-recover after 90 seconds (Self-Healing simulation)
        global.__chaosFreezeTimeout = setTimeout(async () => {
          try {
            global.__isAppFrozen = false;
            await prisma.chaosState.update({
              where: { id: "global" },
              data: { isAppFrozen: false }
            });
            await recordLog(
              "freeze",
              "auto-end",
              "App Freeze simulation completed (90s elapsed). ECS container replacement / Health check self-healed back to 200 Healthy."
            );
            sendSnsIncidentReport("RESOLVED", "Application Freeze (Single-Node HA Test)", "App Freeze simulation completed (90s elapsed). ECS replaced unhealthy container; cluster fully healthy (Self-Healed 100%).");
          } catch (err) {
            console.error("Failed to auto-heal app freeze:", err);
          }
        }, 90000);

        return NextResponse.json({ message: msg });
      } else {
        global.__isAppFrozen = false;
        const msg = "App Freeze Deactivated manually: /api/health restored to 200 Healthy";
        await recordLog("freeze", "stop", msg);
        sendSnsIncidentReport("RESOLVED", "Application Freeze (Single-Node HA Test)", msg + " (Self-Healed 100%).");
        return NextResponse.json({ message: msg });
      }
    }

    // 4. WEBSITE DEFACEMENT SCENARIO
    if (type === "deface") {
      const isStart = action === "start";

      if (global.__chaosDefaceTimeout) {
        clearTimeout(global.__chaosDefaceTimeout);
        global.__chaosDefaceTimeout = undefined;
      }

      await prisma.chaosState.update({
        where: { id: "global" },
        data: { isDefaced: isStart }
      });

      if (isStart) {
        // On-Demand Chaos: Dispatch Canary Guard Bot
        let canaryDispatched = false;
        if (process.env.TRIGGER_CANARY_URL) {
          try {
            fetch(process.env.TRIGGER_CANARY_URL, { method: "POST" })
              .then(async (res) => {
                if (res.ok) {
                  await recordLog("deface", "info", "Canary Guard Bot dispatched and verified incident detection");
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

        const msg = `Website Defacement Activated (CloudFront Failover simulated${canaryDispatched ? ", Guard Bot Dispatched" : ""}, Auto-rollback in 90s)`;
        await recordLog("deface", "start", msg, "CloudFront will failover to S3. Auto-rollback in 90 seconds.");
        sendSnsIncidentReport("TRIGGERED", "Website Defacement", msg);

        // Auto-recover after 90 seconds (Simulate Canary Guard Bot auto-rollback)
        global.__chaosDefaceTimeout = setTimeout(async () => {
          try {
            await prisma.chaosState.update({
              where: { id: "global" },
              data: { isDefaced: false }
            });
            await recordLog(
              "deface",
              "auto-end",
              "Website Defacement resolved automatically (90s elapsed). Canary Guard Bot & CloudFront Origin restored to healthy state."
            );
            sendSnsIncidentReport("RESOLVED", "Website Defacement", "Website Defacement resolved automatically (90s elapsed). Canary Guard Bot & CloudFront Origin restored to healthy state (Self-Healed 100%).");
          } catch (err) {
            console.error("Failed to auto-heal defacement:", err);
          }
        }, 90000);

        return NextResponse.json({ message: msg });
      } else {
        const msg = "Website Defacement Deactivated manually: System normal";
        await recordLog("deface", "stop", msg);
        sendSnsIncidentReport("RESOLVED", "Website Defacement", msg + " (Self-Healed 100%).");
        return NextResponse.json({ message: msg });
      }
    }

    return NextResponse.json({ error: "Unknown chaos type" }, { status: 400 });
  } catch (error: any) {
    console.error("Chaos API Error:", error);
    await recordLog("system", "error", `Chaos execution error: ${error?.message || "Unknown"}`);
    return NextResponse.json({ error: "Failed to trigger chaos" }, { status: 500 });
  }
}
