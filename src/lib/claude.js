export async function generateCardSets({ prompt, playerCount }) {
  const systemPrompt = `You are a Korean language teaching assistant. Generate exactly 3 roleplay scenario sets for Korean language learners based on the teacher's input.

Return ONLY valid JSON. No markdown, no introduction, no explanation. Output must start with '{' and end with '}'.

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
- Each set has 6-9 turns
- Critical for speed: Be extremely concise in English instructions. Avoid long sentences to prevent timeout error.`;

  // 1. 중복 선언 오류 해결 및 변수 정리
  const userMessage = `Teacher's input:\n${prompt}\n\nNumber of players: ${playerCount}`;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3500, // 살짝 줄여서 버퍼 확보 및 타임아웃 방지
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.2 // 생성의 일관성과 속도를 향상시키기 위해 낮춤
    })
  });

  if (!response.ok) {
    throw new Error(`API_ERROR:${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  
  // 2. JSON 파싱 전 전처리 보강 (간혹 마크다운 래퍼가 남거나 앞뒤 공백이 생기는 현상 방지)
  try {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("JSON_NOT_FOUND");
    }
    const cleanJson = text.substring(startIdx, endIdx + 1);
    return JSON.parse(cleanJson);
  } catch (parseError) {
    console.error("Raw AI Output text:", text);
    throw new Error("JSON_PARSE_FAILED");
  }
}
