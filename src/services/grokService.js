const { fetch } = require("undici");
const { getConfig } = require("../config");

async function askGrok({ authorName, content }) {
  const config = getConfig();
  if (!config.grokApiKey) {
    return "La cle API Grok n'est pas configuree. Ajoute GROK_API_KEY sur Railway.";
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.grokApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.grokModel,
      messages: [
        { role: "system", content: config.grokSystemPrompt },
        {
          role: "user",
          content: `Utilisateur Discord: ${authorName}\nMessage: ${content}`
        }
      ],
      temperature: 0.35,
      max_tokens: 900
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Grok API ${response.status}: ${details.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Je n'ai pas pu generer de reponse.";
}

module.exports = {
  askGrok
};
