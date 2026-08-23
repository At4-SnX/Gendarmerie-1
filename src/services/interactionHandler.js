const { ActivityType, MessageFlags } = require("discord.js");
const { getConfig, updateConfig } = require("../config");
const { buildComponentMessage } = require("./componentService");
const {
  resolveMember,
  resolveUser,
  runAntiBot,
  runAntiNuke,
  runBan,
  runClear,
  runHelp,
  runKick,
  runLock,
  runMute,
  runPing,
  runSlowmode,
  runUnlock,
  runUnmute
} = require("./moderationService");
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

function ephemeralConfigPayload(payload) {
  return {
    ...payload,
    flags: (payload.flags || 0) | MessageFlags.Ephemeral
  };
}

async function handleConfigCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const config = getConfig();

  if (subcommand === "voir") {
    await interaction.reply({
      ...ephemeralConfigPayload(buildComponentMessage({
        title: "Configuration",
        body: [
          `Arrivees: ${channelMention(config.welcomeChannelId)}`,
          `Departs: ${channelMention(config.goodbyeChannelId)}`,
          `Assistant IA: ${channelMention(config.aiChannelId)}`,
          `Vocal support: ${channelMention(config.supportWaitingVoiceId)}`,
          `Logs support: ${channelMention(config.supportLogChannelId)}`,
          `Stream: **${config.botStreamName}**`,
          `Prefix: \`${config.prefix || "&"}\``,
          `Anti-bot: **${config.antiBotEnabled ? "actif" : "inactif"}**`,
          `Anti-nuke: **${config.antiNukeEnabled ? "actif" : "inactif"}**`,
          `Seuil anti-nuke: **${config.antiNukeThreshold}**`,
          `Action anti-nuke: **${config.antiNukeAction}**`
        ].join("\n"),
        footer: "Gendarmerie Nationale RP - Administration"
      }))
    });
    return;
  }

  if (subcommand === "texte") {
    const key = interaction.options.getString("type", true);
    const value = interaction.options.getString("valeur", true);
    updateConfig({ [key]: value });

    await interaction.reply({
      ...ephemeralConfigPayload(buildComponentMessage({
        title: "Texte mis a jour",
        body: `Le reglage \`${key}\` a ete modifie.`,
        footer: "Gendarmerie Nationale RP - Administration"
      }))
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
      ...ephemeralConfigPayload(buildComponentMessage({
        title: "Salon mis a jour",
        body: `Le reglage \`${key}\` utilise maintenant ${channel}.`,
        footer: "Gendarmerie Nationale RP - Administration"
      }))
    });
    return;
  }

  if (subcommand === "stream") {
    const name = interaction.options.getString("nom", true);
    updateConfig({ botStreamName: name });
    setPresence(interaction.client);

    await interaction.reply({
      ...ephemeralConfigPayload(buildComponentMessage({
        title: "Stream mis a jour",
        body: `Le stream du bot est maintenant **${name}**.`,
        footer: "Gendarmerie Nationale RP - Administration"
      }))
    });
  }
}

async function handleInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "config") {
    await handleConfigCommand(interaction);
    return;
  }

  if (interaction.commandName === "ping") {
    await runPing(interaction);
    return;
  }

  if (interaction.commandName === "help") {
    await runHelp(interaction);
    return;
  }

  if (interaction.commandName === "kick") {
    const user = interaction.options.getUser("membre", true);
    const target = await resolveMember(interaction.guild, user.id);
    await runKick(interaction, target, interaction.options.getString("raison"));
    return;
  }

  if (interaction.commandName === "ban") {
    const value = interaction.options.getString("utilisateur", true);
    const target = await resolveMember(interaction.guild, value);
    const user = target || (await resolveUser(interaction.client, value));
    await runBan(interaction, user, interaction.options.getString("raison"));
    return;
  }

  if (interaction.commandName === "mute") {
    const user = interaction.options.getUser("membre", true);
    const target = await resolveMember(interaction.guild, user.id);
    await runMute(
      interaction,
      target,
      interaction.options.getString("duree"),
      interaction.options.getString("raison")
    );
    return;
  }

  if (interaction.commandName === "unmute") {
    const user = interaction.options.getUser("membre", true);
    const target = await resolveMember(interaction.guild, user.id);
    await runUnmute(interaction, target);
    return;
  }

  if (interaction.commandName === "clear") {
    await runClear(interaction, interaction.options.getInteger("nombre") || 10);
    return;
  }

  if (interaction.commandName === "lock") {
    await runLock(interaction);
    return;
  }

  if (interaction.commandName === "unlock") {
    await runUnlock(interaction);
    return;
  }

  if (interaction.commandName === "slowmode") {
    await runSlowmode(interaction, interaction.options.getInteger("secondes"));
    return;
  }

  if (interaction.commandName === "antibot") {
    await runAntiBot(interaction, interaction.options.getBoolean("actif", true));
    return;
  }

  if (interaction.commandName === "antinuke") {
    await runAntiNuke(
      interaction,
      interaction.options.getBoolean("actif", true),
      interaction.options.getInteger("seuil"),
      interaction.options.getString("action")
    );
  }
}

module.exports = {
  handleInteraction,
  setPresence
};
