export const handler = async (event) => {
  console.log("[SELF-HEALING] Remediation event received:", JSON.stringify(event));
  const targetUrl = process.env.HEAL_API_URL;
  
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
    console.log('[SELF-HEALING] Defacement successfully repaired in database:', data);
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error("[SELF-HEALING] Error triggering heal:", error);
    return { statusCode: 500, body: error.toString() };
  }
};
