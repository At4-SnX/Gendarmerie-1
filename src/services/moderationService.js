const {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");
const { getConfig, updateConfig } = require("../config");
const { buildComponentMessage } = require("./componentService");

const muteDurations = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000
};

function isAdmin(member) {
  return member?.permissions?.has(PermissionFlagsBits.Administrator);
}

function buildReply(title, body) {
  return buildComponentMessage({
    title,
    body,
    footer: "Gendarmerie Nationale RP - Moderation"
  });
}

async function respond(context, title, body, ephemeral = false) {
  const payload = buildReply(title, body);

  if (context.reply && context.isChatInputCommand?.()) {
    const flags = ephemeral
      ? (payload.flags || 0) | MessageFlags.Ephemeral
      : payload.flags;
    return context.reply({ ...payload, flags });
  }

  return context.reply(payload);
}

async function guardAdmin(context) {
  const member = context.member;
  if (isAdmin(member)) return true;

  await respond(
    context,
    "Acces refuse",
    "Cette commande est reservee aux membres avec la permission `Administrateur`.",
    true
  );
  return false;
}

function parseDuration(input) {
  if (!input) return 60 * 60_000;
  const match = String(input).trim().match(/^(\d+)(s|m|h|d)?$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = (match[2] || "m").toLowerCase();
  const duration = amount * muteDurations[unit];
  return Math.min(duration, 28 * 24 * 60 * 60_000);
}

async function resolveMember(guild, value) {
  if (!value) return null;
  const id = String(value).replace(/[<@!>]/g, "");
  return guild.members.fetch(id).catch(() => null);
}

async function resolveUser(client, value) {
  if (!value) return null;
  const id = String(value).replace(/[<@!>]/g, "");
  return client.users.fetch(id).catch(() => null);
}

function canModerate(executor, target) {
  if (!target || target.id === executor.id) return false;
  if (target.id === target.guild.ownerId) return false;
  return executor.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

async function runKick(context, target, reason) {
  if (!(await guardAdmin(context))) return;
  if (!target) return respond(context, "Kick", "Membre introuvable.");
  if (!canModerate(context.member, target)) {
    return respond(context, "Kick impossible", "Tu ne peux pas kick ce membre avec ta hierarchie actuelle.");
  }

  await target.kick(reason || "Aucune raison indiquee.");
  return respond(context, "Membre kick", `${target.user.tag} a ete kick.\nRaison: ${reason || "non indiquee"}`);
}

async function runBan(context, userOrMember, reason) {
  if (!(await guardAdmin(context))) return;
  if (!userOrMember) return respond(context, "Ban", "Utilisateur introuvable.");

  const userId = userOrMember.user?.id || userOrMember.id;
  const tag = userOrMember.user?.tag || userOrMember.tag || userId;
  const member = userOrMember.user ? userOrMember : await context.guild.members.fetch(userId).catch(() => null);

  if (member && !canModerate(context.member, member)) {
    return respond(context, "Ban impossible", "Tu ne peux pas ban ce membre avec ta hierarchie actuelle.");
  }

  await context.guild.members.ban(userId, {
    reason: reason || "Aucune raison indiquee.",
    deleteMessageSeconds: 0
  });
  return respond(context, "Membre banni", `${tag} a ete banni.\nRaison: ${reason || "non indiquee"}`);
}

async function runMute(context, target, durationInput, reason) {
  if (!(await guardAdmin(context))) return;
  if (!target) return respond(context, "Mute", "Membre introuvable.");
  if (!canModerate(context.member, target)) {
    return respond(context, "Mute impossible", "Tu ne peux pas mute ce membre avec ta hierarchie actuelle.");
  }

  const duration = parseDuration(durationInput);
  if (!duration) return respond(context, "Duree invalide", "Utilise par exemple `10m`, `2h`, `1d`.");

  await target.timeout(duration, reason || "Aucune raison indiquee.");
  return respond(
    context,
    "Membre mute",
    `${target.user.tag} a ete mute pendant ${durationInput || "60m"}.\nRaison: ${reason || "non indiquee"}`
  );
}

async function runUnmute(context, target) {
  if (!(await guardAdmin(context))) return;
  if (!target) return respond(context, "Unmute", "Membre introuvable.");

  await target.timeout(null, "Unmute manuel.");
  return respond(context, "Mute retire", `${target.user.tag} peut de nouveau parler.`);
}

async function runClear(context, amount) {
  if (!(await guardAdmin(context))) return;
  const count = Math.max(1, Math.min(Number(amount || 10), 100));
  if (!context.channel?.bulkDelete) return respond(context, "Clear", "Ce salon ne supporte pas le nettoyage.");

  const deleted = await context.channel.bulkDelete(count, true);
  return respond(context, "Messages supprimes", `${deleted.size} message(s) supprime(s).`, true);
}

async function runLock(context) {
  if (!(await guardAdmin(context))) return;
  if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(context.channel.type)) {
    return respond(context, "Lock", "Cette commande doit etre utilisee dans un salon textuel.");
  }

  await context.channel.permissionOverwrites.edit(context.guild.roles.everyone, {
    SendMessages: false
  });
  return respond(context, "Salon verrouille", `${context.channel} est maintenant verrouille.`);
}

async function runUnlock(context) {
  if (!(await guardAdmin(context))) return;
  await context.channel.permissionOverwrites.edit(context.guild.roles.everyone, {
    SendMessages: null
  });
  return respond(context, "Salon deverrouille", `${context.channel} est de nouveau ouvert.`);
}

async function runSlowmode(context, seconds) {
  if (!(await guardAdmin(context))) return;
  const value = Math.max(0, Math.min(Number(seconds || 0), 21_600));
  await context.channel.setRateLimitPerUser(value);
  return respond(context, "Slowmode", value === 0 ? "Slowmode desactive." : `Slowmode defini a ${value} seconde(s).`);
}

async function runAntiBot(context, enabled) {
  if (!(await guardAdmin(context))) return;
  updateConfig({ antiBotEnabled: enabled });
  return respond(context, "Anti-bot", `Anti-bot ${enabled ? "active" : "desactive"}.`);
}

async function runAntiNuke(context, enabled, threshold, action) {
  if (!(await guardAdmin(context))) return;
  const patch = { antiNukeEnabled: enabled };
  const thresholdNumber = Number(threshold);
  if (Number.isFinite(thresholdNumber)) {
    patch.antiNukeThreshold = Math.max(2, Math.min(thresholdNumber, 10));
  }
  if (action && ["strip", "kick", "ban"].includes(action)) {
    patch.antiNukeAction = action;
  }
  updateConfig(patch);

  return respond(
    context,
    "Anti-nuke",
    `Anti-nuke ${enabled ? "active" : "desactive"}.\nSeuil: ${patch.antiNukeThreshold || getConfig().antiNukeThreshold}\nAction: ${patch.antiNukeAction || getConfig().antiNukeAction}`
  );
}

async function runPing(context) {
  const sentAt = Date.now();
  const wsPing = context.client.ws.ping;
  await respond(context, "Ping", `Latence Discord: \`${wsPing}ms\``);
  return sentAt;
}

async function runHelp(context) {
  const config = getConfig();
  const prefix = config.prefix || "&";
  return respond(
    context,
    "Commandes",
    [
      "`/ping` ou `" + prefix + "ping` - Voir la latence du bot.",
      "`/kick` ou `" + prefix + "kick <id/mention> [raison]`",
      "`/ban` ou `" + prefix + "ban <id/mention> [raison]`",
      "`/mute` ou `" + prefix + "mute <id/mention> [10m|2h|1d] [raison]`",
      "`/unmute` ou `" + prefix + "unmute <id/mention>`",
      "`/clear` ou `" + prefix + "clear [1-100]`",
      "`/lock` / `/unlock` ou `" + prefix + "lock`, `" + prefix + "unlock`",
      "`/slowmode` ou `" + prefix + "slowmode <secondes>`",
      "`/antibot` ou `" + prefix + "antibot on/off`",
      "`/antinuke` ou `" + prefix + "antinuke on/off [seuil] [strip|kick|ban]`"
    ].join("\n")
  );
}

module.exports = {
  buildReply,
  guardAdmin,
  respond,
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
};
