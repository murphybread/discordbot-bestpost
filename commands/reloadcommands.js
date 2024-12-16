const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reloads a command.")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to reload.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const commandName = interaction.options
      .getString("command", true)
      .toLowerCase();
    const commandsPath = path.join(__dirname);
    const commandFile = path.join(commandsPath, `${commandName}.js`);
    if (!fs.existsSync(commandFile)) {
      return interaction.reply(`\`${commandName}\` 명령어 없음`);
    }

    delete require.cache[require.resolve(commandFile)];
    try {
      const newCommand = require(commandFile);
      interaction.client.commands.set(newCommand.data.name, newCommand);
      await interaction.reply(`\`${newCommand.data.name}\` 리로드 완료!`);
    } catch (error) {
      console.error(error);
      await interaction.reply(`리로드 실패: \`${error.message}\``);
    }
  },
};
