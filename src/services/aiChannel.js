const { getConfig } = require("../config");
const { buildComponentMessage } = require("./componentService");
const { askGroq } = require("./groqService");
const logger = require("../utils/logger");

function splitResponse(text) {
  const chunks = [];
  let rest = text;

  while (rest.length > 0) {
    chunks.push(rest.slice(0, 1800));
    rest = rest.slice(1800);
  }

  return chunks;
}

async function handleAiMessage(message) {
  const config = getConfig();
  if (!config.aiChannelId || message.channelId !== config.aiChannelId) return;
  if (message.author.bot || !message.content?.trim()) return;

  await message.channel.sendTyping().catch(() => null);

  try {
    const answer = await askGroq({
      authorName: message.member?.displayName || message.author.username,
      content: message.content.trim()
    });

    const chunks = splitResponse(answer);
    for (const [index, chunk] of chunks.entries()) {
      await message.reply(
        buildComponentMessage({
          title: index === 0 ? "Assistant IA" : "Assistant IA - suite",
          body: chunk,
          footer: "Gendarmerie Nationale RP - Assistant Groq"
        })
      );
    }
  } catch (error) {
    logger.error("Erreur assistant IA.", { error: error.message });
    await message.reply(
      buildComponentMessage({
        title: "Assistant indisponible",
        body: "L'assistant IA ne peut pas repondre pour le moment. Verifie la cle Groq et le modele configure.",
        footer: "Gendarmerie Nationale RP - Assistant Groq"
      })
    );
  }
}

module.exports = {
  handleAiMessage
};
