import { SyntheticsClient, StopCanaryCommand } from "@aws-sdk/client-synthetics";

const synthetics = new SyntheticsClient({});

export const handler = async (event) => {
  // Use ALB URL (Passed as Environment Variable)
  const targetUrl = process.env.HEAL_API_URL;
  const canaryName = process.env.CANARY_NAME || "popdrop-guard-bot";
  
  if (!targetUrl) {
    console.error("Missing HEAL_API_URL environment variable.");
    return { statusCode: 500 };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'deface', action: 'stop' })
    });
    
    const data = await response.json();
    console.log('Self-Healing Triggered:', data);

    // Stop canary immediately so it doesn't continue running and consume quota
    try {
      await synthetics.send(new StopCanaryCommand({ Name: canaryName }));
      console.log(`Successfully stopped canary: ${canaryName}`);
    } catch (canaryErr) {
      console.warn("Canary stop warning (may already be stopped):", canaryErr.message);
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error("Error triggering heal:", error);
    return { statusCode: 500, body: error.toString() };
  }
};
