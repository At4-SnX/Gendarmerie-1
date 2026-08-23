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

client.on(Events.GuildMemberAdd, (member) => {
  sendMemberMessage(member, "welcome");
});

client.on(Events.GuildMemberRemove, (member) => {
  sendMemberMessage(member, "goodbye");
});

client.on(Events.MessageCreate, (message) => {
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
