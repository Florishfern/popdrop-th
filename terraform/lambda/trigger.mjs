import { SyntheticsClient, StartCanaryCommand } from "@aws-sdk/client-synthetics";

const synthetics = new SyntheticsClient({});

export const handler = async (event) => {
  const canaryName = process.env.CANARY_NAME || "popdrop-guard-bot";

  console.log(`Starting canary on-demand: ${canaryName}`);
  try {
    await synthetics.send(new StartCanaryCommand({ Name: canaryName }));
    console.log(`Canary ${canaryName} started successfully.`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Guard Bot (${canaryName}) started on-demand.` }),
    };
  } catch (error) {
    console.warn(`Canary start note: ${error.message}`);
    // If it's already running or starting, that's fine
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
