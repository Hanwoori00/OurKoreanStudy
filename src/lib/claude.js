export async function generateCardSets({ prompt, playerCount }) {
  const systemPrompt = `You are a Korean language teaching assistant. Generate exactly 3 roleplay scenario sets for Korean language learners based on the teacher's input.

Return ONLY valid JSON. No markdown, no explanation.

Format:
{
  "sets": [
    {
      "title": "SET 1 — Short title",
      "situation": "English description of the situation (2-3 sentences)",
      "starter": "emoji + 역할이름 (Korean role name that starts first)",
      "roles": [
        {
          "emoji": "emoji",
          "label": "ROLE A",
          "name": "역할이름 (Korean)",
          "desc": "Short English description of this role"
        }
      ],
      "turns": [
        [
          { "icon": "🗣️ or 👂", "text": "English instruction", "from": null },
          { "icon": "🗣️ or 👂", "text": "When asked about X — do Y", "from": "역할이름" },
          null
        ]
      ]
    }
  ]
}

Rules:
- Exactly 3 sets (1-2 everyday situations + 1 fun/creative)
- Exactly ${playerCount} roles per set
- 🗣️ = speak first / initiate. from must be null
- 👂 = wait and respond. text must start with "When asked/told about X —". from must be the Korean role name of who triggers it
- null = this role has no action in this turn
- Turns must follow natural conversation order
- Use ONLY vocabulary and grammar appropriate for the level described
- Role names in Korean, everything else in English
- Each set has 6-9 turns`;

  const userMessage = `Teacher's input:\n${prompt}\n\nNumber of players: ${playerCount}`;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
