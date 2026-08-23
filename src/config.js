const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const runtimeConfigPath = path.join(dataDir, "runtime-config.json");

const defaults = {
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
  goodbyeChannelId: process.env.GOODBYE_CHANNEL_ID || "",
  aiChannelId: process.env.AI_CHANNEL_ID || "",
  supportWaitingVoiceId: process.env.SUPPORT_WAITING_VOICE_ID || "",
  supportLogChannelId: process.env.SUPPORT_LOG_CHANNEL_ID || "",
  welcomeMessage:
    process.env.WELCOME_MESSAGE ||
    "Bienvenue {user} au sein de la Gendarmerie Nationale RP.",
  goodbyeMessage:
    process.env.GOODBYE_MESSAGE ||
    "{user} quitte la Gendarmerie Nationale RP. Bonne continuation.",
  supportTtsMessage:
    process.env.SUPPORT_TTS_MESSAGE ||
    "Bonjour {user}, un membre de la gendarmerie va vous prendre en charge. Merci de patienter dans le salon attente de move.",
  supportTtsLang: process.env.SUPPORT_TTS_LANG || "fr",
  botStreamName: process.env.BOT_STREAM_NAME || "Gendarmerie",
  botStatusText: process.env.BOT_STATUS_TEXT || "Gendarmerie Nationale RP",
  prefix: process.env.PREFIX || "&",
  antiBotEnabled: process.env.ANTIBOT_ENABLED === "true",
  antiNukeEnabled: process.env.ANTINUKE_ENABLED === "true",
  antiNukeThreshold: Number(process.env.ANTINUKE_THRESHOLD || 3),
  antiNukeWindowMs: Number(process.env.ANTINUKE_WINDOW_MS || 10_000),
  antiNukeAction: process.env.ANTINUKE_ACTION || "strip",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  groqSystemPrompt:
    process.env.GROQ_SYSTEM_PROMPT ||
    "Tu es l'assistant officiel de la Gendarmerie Nationale RP. Reponds de facon professionnelle, courte et utile. Reste dans le cadre RP.",
  cardTemplate: process.env.CARD_TEMPLATE || "assets/gendarmerie-template.png"
};

function readRuntimeConfig() {
  if (!fs.existsSync(runtimeConfigPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8"));
  } catch (error) {
    console.warn("Configuration runtime illisible, valeurs .env utilisees.", error);
    return {};
  }
}

function getConfig() {
  return {
    ...defaults,
    ...readRuntimeConfig(),
    discordToken: process.env.DISCORD_TOKEN || "",
    discordClientId: process.env.DISCORD_CLIENT_ID || "",
    discordGuildId: process.env.DISCORD_GUILD_ID || "",
    groqApiKey: process.env.GROQ_API_KEY || "",
    rootDir
  };
}

function updateConfig(patch) {
  fs.mkdirSync(dataDir, { recursive: true });
  const next = { ...readRuntimeConfig(), ...patch };
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(next, null, 2));
  return next;
}

function formatTemplate(template, memberOrUser) {
  const user = memberOrUser.user || memberOrUser;
  const guild = memberOrUser.guild;

  return String(template || "")
    .replaceAll("{user}", `<@${user.id}>`)
    .replaceAll("{username}", user.username)
    .replaceAll("{displayName}", memberOrUser.displayName || user.globalName || user.username)
    .replaceAll("{server}", guild?.name || "le serveur");
}

module.exports = {
  getConfig,
  updateConfig,
  formatTemplate
};
