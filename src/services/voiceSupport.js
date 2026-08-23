const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { fetch } = require("undici");
const {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior
} = require("@discordjs/voice");
const { getConfig, formatTemplate } = require("../config");
const { buildComponentMessage } = require("./componentService");
const logger = require("../utils/logger");

const players = new Map();
const queues = new Map();

function getPlayer(guildId) {
  if (!players.has(guildId)) {
    players.set(
      guildId,
      createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      })
    );
  }

  return players.get(guildId);
}

async function connectToWaitingChannel(client) {
  const config = getConfig();
  if (!config.supportWaitingVoiceId) return null;

  const channel = await client.channels.fetch(config.supportWaitingVoiceId).catch(() => null);
  if (!channel || channel.type !== 2) {
    logger.warn("Salon vocal support introuvable ou invalide.", {
      channelId: config.supportWaitingVoiceId
    });
    return null;
  }

  const existing = getVoiceConnection(channel.guild.id);
  if (existing) return existing;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  connection.subscribe(getPlayer(channel.guild.id));

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
      ]);
    } catch {
      connection.destroy();
      setTimeout(() => connectToWaitingChannel(client), 5_000);
    }
  });

  logger.info("Connecte au vocal support.", { channelId: channel.id });
  return connection;
}

async function saveTtsFile(message, lang) {
  const filePath = path.join(os.tmpdir(), `gendarmerie-tts-${Date.now()}.mp3`);
  const url = new URL("https://translate.google.com/translate_tts");
  url.searchParams.set("ie", "UTF-8");
  url.searchParams.set("client", "tw-ob");
  url.searchParams.set("tl", lang || "fr");
  url.searchParams.set("q", message.slice(0, 180));

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`TTS HTTP ${response.status}`);
  }

  fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
}

async function playTtsForMember(member) {
  const config = getConfig();
  if (!config.supportWaitingVoiceId) return;

  const guildId = member.guild.id;
  const queue = queues.get(guildId) || Promise.resolve();

  const next = queue
    .catch(() => null)
    .then(async () => {
      await connectToWaitingChannel(member.client);
      const player = getPlayer(guildId);
      const text = formatTemplate(config.supportTtsMessage, member).replace(/<@!?(\d+)>/g, member.displayName);
      const filePath = await saveTtsFile(text, config.supportTtsLang);

      await new Promise((resolve, reject) => {
        const resource = createAudioResource(filePath);

        const clean = () => {
          fs.rm(filePath, { force: true }, () => null);
          player.off(AudioPlayerStatus.Idle, onIdle);
          player.off("error", onError);
        };
        const onIdle = () => {
          clean();
          resolve();
        };
        const onError = (error) => {
          clean();
          reject(error);
        };

        player.once(AudioPlayerStatus.Idle, onIdle);
        player.once("error", onError);
        player.play(resource);
      });
    });

  queues.set(guildId, next);
}

async function logSupportJoin(member) {
  const config = getConfig();
  if (!config.supportLogChannelId) return;

  const channel = await member.client.channels.fetch(config.supportLogChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel.send(
    buildComponentMessage({
      title: "Support vocal",
      body: `${member} vient de rejoindre le salon d'attente.`,
      footer: "Gendarmerie Nationale RP - Support"
    })
  );
}

async function handleVoiceStateUpdate(oldState, newState) {
  const config = getConfig();
  if (!config.supportWaitingVoiceId) return;
  if (newState.member?.user.bot) return;

  const joinedWaiting =
    oldState.channelId !== config.supportWaitingVoiceId &&
    newState.channelId === config.supportWaitingVoiceId;

  if (!joinedWaiting) return;

  await logSupportJoin(newState.member).catch((error) =>
    logger.warn("Log support impossible.", { error: error.message })
  );

  await playTtsForMember(newState.member).catch((error) =>
    logger.error("TTS support impossible.", { error: error.message })
  );
}

module.exports = {
  connectToWaitingChannel,
  handleVoiceStateUpdate
};
