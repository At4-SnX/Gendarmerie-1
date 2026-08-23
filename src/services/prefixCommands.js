const { getConfig } = require("../config");
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

function splitArgs(content) {
  const matches = content.match(/"[^"]+"|'[^']+'|\S+/g) || [];
  return matches.map((arg) => arg.replace(/^["']|["']$/g, ""));
}

function parseToggle(value) {
  const normalized = String(value || "").toLowerCase();
  if (["on", "true", "1", "oui", "actif", "enable", "enabled"].includes(normalized)) return true;
  if (["off", "false", "0", "non", "inactif", "disable", "disabled"].includes(normalized)) return false;
  return null;
}

async function handlePrefixCommand(message) {
  const config = getConfig();
  const prefix = config.prefix || "&";
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return false;

  const args = splitArgs(message.content.slice(prefix.length).trim());
  const command = args.shift()?.toLowerCase();
  if (!command) return false;

  if (command === "ping") {
    await runPing(message);
    return true;
  }

  if (command === "help") {
    await runHelp(message);
    return true;
  }

  if (command === "kick") {
    const target = await resolveMember(message.guild, args.shift());
    await runKick(message, target, args.join(" "));
    return true;
  }

  if (command === "ban") {
    const value = args.shift();
    const target = await resolveMember(message.guild, value);
    const user = target || (await resolveUser(message.client, value));
    await runBan(message, user, args.join(" "));
    return true;
  }

  if (command === "mute") {
    const target = await resolveMember(message.guild, args.shift());
    const duration = args.shift();
    await runMute(message, target, duration, args.join(" "));
    return true;
  }

  if (command === "unmute") {
    const target = await resolveMember(message.guild, args.shift());
    await runUnmute(message, target);
    return true;
  }

  if (command === "clear") {
    await runClear(message, args.shift() || 10);
    return true;
  }

  if (command === "lock") {
    await runLock(message);
    return true;
  }

  if (command === "unlock") {
    await runUnlock(message);
    return true;
  }

  if (command === "slowmode") {
    await runSlowmode(message, args.shift() || 0);
    return true;
  }

  if (command === "antibot") {
    const enabled = parseToggle(args.shift());
    if (enabled === null) {
      await message.reply("Utilise `&antibot on` ou `&antibot off`.");
      return true;
    }
    await runAntiBot(message, enabled);
    return true;
  }

  if (command === "antinuke") {
    const enabled = parseToggle(args.shift());
    if (enabled === null) {
      await message.reply("Utilise `&antinuke on/off [seuil] [strip|kick|ban]`.");
      return true;
    }
    const first = args.shift();
    const second = args.shift();
    const threshold = Number.isFinite(Number(first)) ? first : null;
    const action = threshold ? second : first;
    await runAntiNuke(message, enabled, threshold, action);
    return true;
  }

  return false;
}

module.exports = {
  handlePrefixCommand
};
