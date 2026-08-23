const http = require("node:http");
const {
  Client,
  Events,
  GatewayIntentBits,
  Partials
} = require("discord.js");
const { getConfig } = require("./config");
const { handleAiMessage } = require("./services/aiChannel");
const { handleInteraction, setPresence } = require("./services/interactionHandler");
const { sendMemberMessage } = require("./services/memberEvents");
const { handlePrefixCommand } = require("./services/prefixCommands");
const { auditEvents, handleAntiBot, handleAuditProtection } = require("./services/protectionService");
const { connectToWaitingChannel, handleVoiceStateUpdate } = require("./services/voiceSupport");
const logger = require("./utils/logger");

const config = getConfig();

if (!config.discordToken) {
  throw new Error("DISCORD_TOKEN est obligatoire.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.GuildMember, Partials.User]
});

client.once(Events.ClientReady, async () => {
  logger.info("Bot connecte.", { tag: client.user.tag });
  setPresence(client);
  await connectToWaitingChannel(client).catch((error) =>
    logger.warn("Connexion vocale initiale impossible.", { error: error.message })
  );
});

client.on(Events.GuildMemberAdd, async (member) => {
  const blocked = await handleAntiBot(member).catch((error) => {
    logger.error("Erreur anti-bot.", { error: error.message });
    return false;
  });
  if (blocked) return;

  sendMemberMessage(member, "welcome");
});

client.on(Events.GuildMemberRemove, (member) => {
  sendMemberMessage(member, "goodbye");
});

client.on(Events.MessageCreate, async (message) => {
  const handledCommand = await handlePrefixCommand(message).catch((error) => {
    logger.error("Erreur commande prefix.", { error: error.message });
    return false;
  });
  if (handledCommand) return;

  handleAiMessage(message);
});

client.on(Events.InteractionCreate, (interaction) => {
  handleInteraction(interaction).catch((error) => {
    logger.error("Erreur interaction.", { error: error.message });
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({
        content: "Une erreur est survenue pendant l'execution de la commande.",
        ephemeral: true
      }).catch(() => null);
    }
  });
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  handleVoiceStateUpdate(oldState, newState);
});

client.on(Events.ChannelCreate, (channel) => {
  if (channel.guild) {
    handleAuditProtection(channel.guild, ...auditEvents.channelCreate).catch((error) =>
      logger.error("Erreur anti-nuke.", { error: error.message })
    );
  }
});

client.on(Events.ChannelDelete, (channel) => {
  if (channel.guild) {
    handleAuditProtection(channel.guild, ...auditEvents.channelDelete).catch((error) =>
      logger.error("Erreur anti-nuke.", { error: error.message })
    );
  }
});

client.on(Events.GuildRoleCreate, (role) => {
  handleAuditProtection(role.guild, ...auditEvents.roleCreate).catch((error) =>
    logger.error("Erreur anti-nuke.", { error: error.message })
  );
});

client.on(Events.GuildRoleDelete, (role) => {
  handleAuditProtection(role.guild, ...auditEvents.roleDelete).catch((error) =>
    logger.error("Erreur anti-nuke.", { error: error.message })
  );
});

client.on(Events.GuildBanAdd, (ban) => {
  handleAuditProtection(ban.guild, ...auditEvents.guildBanAdd).catch((error) =>
    logger.error("Erreur anti-nuke.", { error: error.message })
  );
});

client.on(Events.Error, (error) => {
  logger.error("Erreur client Discord.", { error: error.message });
});

const port = Number(process.env.PORT || 3000);
http
  .createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        service: "gendarmerie-rp-bot",
        path: request.url
      })
    );
  })
  .listen(port, () => logger.info("Healthcheck actif.", { port }));

client.login(config.discordToken);
