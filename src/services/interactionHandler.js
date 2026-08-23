const { ActivityType } = require("discord.js");
const { getConfig, updateConfig } = require("../config");
const { buildComponentMessage } = require("./componentService");
const { connectToWaitingChannel } = require("./voiceSupport");

function setPresence(client) {
  const config = getConfig();
  client.user.setPresence({
    activities: [
      {
        name: config.botStreamName || "Gendarmerie",
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/gendarmerie"
      }
    ],
    status: "online"
  });
}

function channelMention(id) {
  return id ? `<#${id}>` : "`non configure`";
}

async function handleConfigCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const config = getConfig();

  if (subcommand === "voir") {
    await interaction.reply({
      ...buildComponentMessage({
        title: "Configuration",
        body: [
          `Arrivees: ${channelMention(config.welcomeChannelId)}`,
          `Departs: ${channelMention(config.goodbyeChannelId)}`,
          `Assistant IA: ${channelMention(config.aiChannelId)}`,
          `Vocal support: ${channelMention(config.supportWaitingVoiceId)}`,
          `Logs support: ${channelMention(config.supportLogChannelId)}`,
          `Stream: **${config.botStreamName}**`
        ].join("\n"),
        footer: "Gendarmerie Nationale RP - Administration"
      }),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "texte") {
    const key = interaction.options.getString("type", true);
    const value = interaction.options.getString("valeur", true);
    updateConfig({ [key]: value });

    await interaction.reply({
      ...buildComponentMessage({
        title: "Texte mis a jour",
        body: `Le reglage \`${key}\` a ete modifie.`,
        footer: "Gendarmerie Nationale RP - Administration"
      }),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "salon") {
    const key = interaction.options.getString("type", true);
    const channel = interaction.options.getChannel("salon", true);
    updateConfig({ [key]: channel.id });

    if (key === "supportWaitingVoiceId") {
      await connectToWaitingChannel(interaction.client);
    }

    await interaction.reply({
      ...buildComponentMessage({
        title: "Salon mis a jour",
        body: `Le reglage \`${key}\` utilise maintenant ${channel}.`,
        footer: "Gendarmerie Nationale RP - Administration"
      }),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "stream") {
    const name = interaction.options.getString("nom", true);
    updateConfig({ botStreamName: name });
    setPresence(interaction.client);

    await interaction.reply({
      ...buildComponentMessage({
        title: "Stream mis a jour",
        body: `Le stream du bot est maintenant **${name}**.`,
        footer: "Gendarmerie Nationale RP - Administration"
      }),
      ephemeral: true
    });
  }
}

async function handleInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "config") {
    await handleConfigCommand(interaction);
  }
}

module.exports = {
  handleInteraction,
  setPresence
};
