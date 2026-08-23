const { fetch } = require("undici");
const { getConfig } = require("../config");

async function askGroq({ authorName, content }) {
  const config = getConfig();
  if (!config.groqApiKey) {
    return "La cle API Groq n'est pas configuree. Ajoute GROQ_API_KEY sur Railway.";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.groqApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [
        { role: "system", content: config.groqSystemPrompt },
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
    throw new Error(`Groq API ${response.status}: ${details.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Je n'ai pas pu generer de reponse.";
}

module.exports = {
  askGroq
};
