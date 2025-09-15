exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Content-Type": "application/json"
  };

  const method = event?.requestContext?.http?.method || event?.httpMethod;
  if (method === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "OPENAI_API_KEY not set" }) };
  }
  
  let body = {};
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
  } catch (_) {}

  const userMessage = (body.message || "").toString().trim();

  const systemPrompt =
    "You are a helpful assistant for a community reporting app. " +
    "Guide users to report illegal dumping: (1) short description, (2) photo (if available), " +
    "(3) location/address, (4) extra details (time, vehicles, repeat dumping). " +
    "Confirm the details, keep tone clear/supportive, and gently steer back to reporting if off-topic. " +
    "If asked about the process, explain the report goes to the community dashboard for review.";

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          // If user sent nothing, start the convo politely:
          userMessage ? { role: "user", content: userMessage } : { role: "user", content: "Hi" }
        ],
        temperature: 0.7,
        max_tokens: 300   // <-- bigger so replies don't truncate
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({ error: data?.error?.message || `OpenAI error ${resp.status}` })
      };
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "Thanks—how can I help you report the issue?";
    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error("Lambda error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err?.message || "Unknown error" }) };
  }
};

