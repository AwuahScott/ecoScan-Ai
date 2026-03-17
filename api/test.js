export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return res
      .status(200)
      .json({ status: "FAIL", reason: "ANTHROPIC_API_KEY not found" });

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
        max_tokens: 10,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });

    const text = await response.text();
    return res.status(200).json({
      status: response.ok ? "SUCCESS" : "FAIL",
      httpStatus: response.status,
      keyPrefix: key.substring(0, 12) + "...",
      response: text,
    });
  } catch (err) {
    return res.status(200).json({ status: "FAIL", error: err.message });
  }
}
