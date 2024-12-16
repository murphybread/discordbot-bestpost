const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

function snowflakeToTimestamp(snowflake) {
  const timestamp = Number((BigInt(snowflake) >> 22n) + 1420070400000n);
  return new Date(timestamp).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("슬래시 커맨드 등록/삭제 시작...");

    // 1. 모든 길드 커맨드 삭제
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: [] }
    );
    console.log("모든 길드 커맨드 삭제 완료.");

    // 2. 현재 존재하는 커맨드 등록
    if (commands.length > 0) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );
      console.log("슬래시 커맨드 등록 완료!");

      const currentDateTime = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      });
      console.log(`명령어 GET 요청 시간: ${currentDateTime}`);

      const updatedRegisteredCommands = await rest.get(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        )
      );

      for (const cmd of updatedRegisteredCommands) {
        const updatedTime = snowflakeToTimestamp(cmd.version);
        console.log(`명령어: ${cmd.name}, 마지막 업데이트: ${updatedTime}`);
      }
    } else {
      console.log("등록할 커맨드가 없습니다.");
    }
  } catch (error) {
    console.error("오류 발생:", error);
  }
})();
