const { getConfig, formatTemplate } = require("../config");
const { createMemberCard } = require("./cardService");
const { buildComponentMessage } = require("./componentService");
const logger = require("../utils/logger");

async function sendMemberMessage(member, mode) {
  const config = getConfig();
  const channelId = mode === "welcome" ? config.welcomeChannelId : config.goodbyeChannelId;
  if (!channelId) return;

  const channel = await member.client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const template = mode === "welcome" ? config.welcomeMessage : config.goodbyeMessage;
  const title = mode === "welcome" ? "Nouvelle arrivee" : "Depart signale";
  const footer =
    mode === "welcome"
      ? "Gendarmerie Nationale RP - Accueil"
      : "Gendarmerie Nationale RP - Effectifs";

  try {
    const { attachment, fileName } = await createMemberCard(member, mode);
    await channel.send(
      buildComponentMessage({
        title,
        body: formatTemplate(template, member),
        imageName: fileName,
        attachment,
        footer
      })
    );
  } catch (error) {
    logger.error("Impossible d'envoyer la carte membre.", {
      mode,
      userId: member.id,
      error: error.message
    });
  }
}

module.exports = {
  sendMemberMessage
};
