// export default async function handler(req, res) {
//   // Only allow POST requests
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const { query } = req.body;
//   if (!query || typeof query !== "string" || query.trim().length === 0) {
//     return res.status(400).json({ error: "Query is required" });
//   }

//   const SYSTEM = `You are EcoScan AI, an environmental education assistant for children aged 10-12 in Ghana and West Africa.
// When given a subject, respond ONLY with a JSON object (no markdown, no backticks, no extra text) in exactly this shape:
// {"emoji":"<single emoji>","name":"<display name>","category":"<Plant|Animal|Object|Habit|Energy|Water|Food>","ecoScore":<integer 1-10>,"scoreLabel":"<Good|Okay|Needs Work>","scoreColor":"<good|ok|bad>","whatIsIt":"<2 short kid-friendly sentences>","envImpact":"<2 sentences about environmental impact specific to Ghana/West Africa>","funFact":"<1 surprising fact>","greenTip":"<1 specific action a child can do today>"}`;

//   try {
//     const response = await fetch("https://api.anthropic.com/v1/messages", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": process.env.ANTHROPIC_API_KEY,   // ← secret, stored in Vercel dashboard
//         "anthropic-version": "2023-06-01"
//       },
//       body: JSON.stringify({
//         model: "claude-haiku-4-5-20251001",  // fast + cheap for a student project
//         max_tokens: 800,
//         system: SYSTEM,
//         messages: [{ role: "user", content: `Scan this: ${query.trim()}` }]
//       })
//     });

//     if (!response.ok) {
//       const err = await response.text();
//       return res.status(502).json({ error: "AI service error", detail: err });
//     }

//     const data = await response.json();
//     const raw = data.content?.[0]?.text || "";
//     const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

//     return res.status(200).json(parsed);

//   } catch (error) {
//     return res.status(500).json({ error: "Server error: " + error.message });
//   }
// }

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check the API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    return res
      .status(500)
      .json({
        error: "ANTHROPIC_API_KEY is not set in Vercel environment variables.",
      });
  }

  const { query } = req.body || {};
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Query is required" });
  }

  const SYSTEM = `You are EcoScan AI, an environmental education assistant for children aged 10-12 in Ghana and West Africa.
When given a subject, respond ONLY with a JSON object (no markdown, no backticks, no extra text) in exactly this shape:
{"emoji":"<single emoji>","name":"<display name>","category":"<Plant|Animal|Object|Habit|Energy|Water|Food>","ecoScore":<integer 1-10>,"scoreLabel":"<Good|Okay|Needs Work>","scoreColor":"<good|ok|bad>","whatIsIt":"<2 short kid-friendly sentences>","envImpact":"<2 sentences about environmental impact specific to Ghana/West Africa>","funFact":"<1 surprising fact>","greenTip":"<1 specific action a child can do today>"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: "user", content: `Scan this: ${query.trim()}` }],
      }),
    });

    // Forward exact Anthropic error for easier debugging
    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return res.status(502).json({
        error: `Anthropic API returned ${response.status}`,
        detail: errText,
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (parseErr) {
      console.error("JSON parse failed. Raw:", raw);
      return res
        .status(502)
        .json({ error: "Could not parse AI response", raw });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ error: "Server error: " + error.message });
  }
}
