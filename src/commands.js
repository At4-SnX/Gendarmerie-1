const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configurer le bot Gendarmerie Nationale RP.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
    ),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Voir la latence du bot."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Afficher les commandes du bot."),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick un membre.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName("membre").setDescription("Membre a kick.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("raison").setDescription("Raison du kick.").setMaxLength(512)
    ),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban un membre ou un utilisateur par ID.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName("utilisateur").setDescription("Mention ou ID Discord.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("raison").setDescription("Raison du ban.").setMaxLength(512)
    ),
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute temporairement un membre.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName("membre").setDescription("Membre a mute.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("duree").setDescription("Exemples: 10m, 2h, 1d. Defaut: 60m.")
    )
    .addStringOption((option) =>
      option.setName("raison").setDescription("Raison du mute.").setMaxLength(512)
    ),
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Retirer le mute temporaire d'un membre.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName("membre").setDescription("Membre a unmute.").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Supprimer des messages dans le salon.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de messages a supprimer, entre 1 et 100.")
        .setMinValue(1)
        .setMaxValue(100)
    ),
  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Verrouiller le salon actuel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Deverrouiller le salon actuel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Configurer le slowmode du salon actuel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option
        .setName("secondes")
        .setDescription("Delai en secondes. 0 pour desactiver.")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),
  new SlashCommandBuilder()
    .setName("antibot")
    .setDescription("Activer ou desactiver l'anti-bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("actif").setDescription("Etat de l'anti-bot.").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Activer ou regler l'anti-nuke.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("actif").setDescription("Etat de l'anti-nuke.").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("seuil")
        .setDescription("Nombre d'actions suspectes dans la fenetre, entre 2 et 10.")
        .setMinValue(2)
        .setMaxValue(10)
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Action automatique.")
        .addChoices(
          { name: "Retirer les roles", value: "strip" },
          { name: "Kick", value: "kick" },
          { name: "Ban", value: "ban" }
        )
    )
].map((command) => command.toJSON());

module.exports = { commands };
