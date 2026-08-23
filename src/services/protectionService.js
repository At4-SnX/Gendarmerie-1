const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { getConfig } = require("../config");
const { buildComponentMessage } = require("./componentService");
const logger = require("../utils/logger");

const actorActions = new Map();

const dangerousPermissions = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ManageWebhooks
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logProtection(guild, title, body) {
  const config = getConfig();
  if (!config.supportLogChannelId) return;

  const channel = await guild.client.channels.fetch(config.supportLogChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel.send(
    buildComponentMessage({
      title,
      body,
      footer: "Gendarmerie Nationale RP - Protection"
    })
  );
}

async function handleAntiBot(member) {
  const config = getConfig();
  if (!config.antiBotEnabled || !member.user.bot) return false;

  if (!member.kickable) {
    await logProtection(
      member.guild,
      "Anti-bot",
      `Bot detecte mais impossible a kick: ${member.user.tag}. Verifie la hierarchie du role du bot.`
    );
    return false;
  }

  await member.kick("Anti-bot active.");
  await logProtection(member.guild, "Anti-bot", `Bot bloque et kick: ${member.user.tag}.`);
  return true;
}

function registerActorAction(guildId, userId, windowMs) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const previous = actorActions.get(key) || [];
  const next = previous.filter((time) => now - time <= windowMs);
  next.push(now);
  actorActions.set(key, next);
  return next.length;
}

async function stripDangerousRoles(member) {
  const removableRoles = member.roles.cache.filter((role) => {
    if (role.id === member.guild.id) return false;
    if (!role.editable) return false;
    return dangerousPermissions.some((permission) => role.permissions.has(permission));
  });

  if (removableRoles.size === 0) return 0;
  await member.roles.remove(removableRoles, "Anti-nuke: permissions dangereuses retirees.");
  return removableRoles.size;
}

async function punishActor(guild, userId, count, auditName) {
  const config = getConfig();
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  if (member.id === guild.ownerId || member.id === guild.client.user.id) return;

  const reason = `Anti-nuke: ${count} actions sensibles detectees (${auditName}).`;

  try {
    if (config.antiNukeAction === "ban" && member.bannable) {
      await member.ban({ reason, deleteMessageSeconds: 0 });
      await logProtection(guild, "Anti-nuke", `${member.user.tag} a ete banni.\n${reason}`);
      return;
    }

    if (config.antiNukeAction === "kick" && member.kickable) {
      await member.kick(reason);
      await logProtection(guild, "Anti-nuke", `${member.user.tag} a ete kick.\n${reason}`);
      return;
    }

    const removed = await stripDangerousRoles(member);
    await logProtection(
      guild,
      "Anti-nuke",
      `${member.user.tag} a ete bloque.\nRoles dangereux retires: ${removed}.\n${reason}`
    );
  } catch (error) {
    logger.error("Action anti-nuke impossible.", { error: error.message, userId });
  }
}

async function handleAuditProtection(guild, auditType, auditName) {
  const config = getConfig();
  if (!config.antiNukeEnabled) return;

  await wait(900);
  const logs = await guild.fetchAuditLogs({ type: auditType, limit: 1 }).catch(() => null);
  const entry = logs?.entries?.first();
  if (!entry?.executorId) return;

  const executorId = entry.executorId;
  if (executorId === guild.client.user.id || executorId === guild.ownerId) return;

  const count = registerActorAction(
    guild.id,
    executorId,
    Number(config.antiNukeWindowMs || 10_000)
  );

  if (count >= Number(config.antiNukeThreshold || 3)) {
    await punishActor(guild, executorId, count, auditName);
  }
}

module.exports = {
  handleAntiBot,
  handleAuditProtection,
  auditEvents: {
    channelCreate: [AuditLogEvent.ChannelCreate, "creation de salons"],
    channelDelete: [AuditLogEvent.ChannelDelete, "suppression de salons"],
    roleCreate: [AuditLogEvent.RoleCreate, "creation de roles"],
    roleDelete: [AuditLogEvent.RoleDelete, "suppression de roles"],
    guildBanAdd: [AuditLogEvent.MemberBanAdd, "bannissements"]
  }
};
