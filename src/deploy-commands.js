const { REST, Routes } = require("discord.js");
const { commands } = require("./commands");
const { getConfig } = require("./config");

async function main() {
  const config = getConfig();

  if (!config.discordToken || !config.discordClientId || !config.discordGuildId) {
    throw new Error("DISCORD_TOKEN, DISCORD_CLIENT_ID et DISCORD_GUILD_ID sont obligatoires.");
  }

  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    { body: commands }
  );

  console.log("Commandes Discord deployees.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
