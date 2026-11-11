import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eventbridge = new EventBridgeClient({});

export const handler = async (event) => {
  const targetUrl = process.env.TARGET_URL;
  console.log(`[CANARY BOT] Dispatched on-demand to probe: ${targetUrl}`);

  // Wait 1.5 seconds for the chaos defacement to persist in DB
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
    console.log(`[CANARY BOT] Website response status: ${res.status}`);

    if (res.status === 500) {
      console.warn("[CANARY BOT] ALB returned HTTP 500 (Defaced)! Publishing EventBridge alert...");
      
      // Emit Canary failure event to EventBridge
      await eventbridge.send(new PutEventsCommand({
        Entries: [
          {
            Source: "popdrop.canary",
            DetailType: "Canary Test Run Failure",
            Detail: JSON.stringify({
              canaryName: "popdrop-guard-bot",
              status: "FAILED",
              reason: "ALB returned HTTP 500. Website defaced!"
            })
          }
        ]
      }));

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "defaced_detected", action: "eventbridge_alert_sent" }),
      };
    }

    console.log("[CANARY BOT] Website is healthy (HTTP 200).");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "healthy", httpStatus: res.status }),
    };
  } catch (error) {
    console.error("[CANARY BOT] Error checking website:", error.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
