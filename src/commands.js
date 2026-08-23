const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configurer le bot Gendarmerie Nationale RP.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand.setName("voir").setDescription("Afficher la configuration active.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("texte")
        .setDescription("Modifier un texte configurable.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Texte a modifier.")
            .setRequired(true)
            .addChoices(
              { name: "Message d'arrivee", value: "welcomeMessage" },
              { name: "Message de depart", value: "goodbyeMessage" },
              { name: "Message vocal support", value: "supportTtsMessage" },
              { name: "Instruction systeme IA", value: "groqSystemPrompt" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("valeur")
            .setDescription("Nouveau texte. Variables: {user}, {username}, {displayName}, {server}.")
            .setRequired(true)
            .setMaxLength(1900)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("salon")
        .setDescription("Modifier un salon utilise par le bot.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Salon a modifier.")
            .setRequired(true)
            .addChoices(
              { name: "Arrivees", value: "welcomeChannelId" },
              { name: "Departs", value: "goodbyeChannelId" },
              { name: "Assistant IA", value: "aiChannelId" },
              { name: "Vocal attente support", value: "supportWaitingVoiceId" },
              { name: "Logs support", value: "supportLogChannelId" }
            )
        )
        .addChannelOption((option) =>
          option
            .setName("salon")
            .setDescription("Salon Discord.")
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
              ChannelType.GuildVoice,
              ChannelType.GuildStageVoice
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stream")
        .setDescription("Modifier le stream affiche par le bot.")
        .addStringOption((option) =>
          option
            .setName("nom")
            .setDescription("Nom du stream.")
            .setRequired(true)
            .setMaxLength(128)
        )
    )
].map((command) => command.toJSON());

module.exports = { commands };
