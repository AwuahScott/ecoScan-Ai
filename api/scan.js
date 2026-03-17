export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });

  const { query } = req.body || {};
  if (!query || !query.trim())
    return res.status(400).json({ error: "Query is required" });

  const SYSTEM = `You are EcoScan AI, an environmental education assistant for children aged 10-12 in Ghana and West Africa.
When given a subject, respond ONLY with a JSON object (no markdown, no backticks, no extra text) in exactly this shape:
{"emoji":"<single emoji>","name":"<display name>","category":"<Plant|Animal|Object|Habit|Energy|Water|Food>","ecoScore":<integer 1-10>,"scoreLabel":"<Good|Okay|Needs Work>","scoreColor":"<good|ok|bad>","whatIsIt":"<2 short kid-friendly sentences>","envImpact":"<2 sentences about environmental impact specific to Ghana/West Africa>","funFact":"<1 surprising fact>","greenTip":"<1 specific action a child can do today>"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: "user", content: `Scan this: ${query.trim()}` }],
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Anthropic error:", response.status, responseText);
      return res
        .status(200)
        .json({
          _debug: true,
          anthropicStatus: response.status,
          anthropicError: responseText,
        });
    }

    const data = JSON.parse(responseText);
    const raw = data.content?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return res
        .status(200)
        .json({ _debug: true, parseError: "Could not parse AI response", raw });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Fetch error:", err.message);
    return res.status(200).json({ _debug: true, fetchError: err.message });
  }
}
