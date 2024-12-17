require("dotenv").config();
const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

// 캐시 객체 선언 (메모리 캐시)
const cache = {
  lastUpdate: null,
  data: null,
};

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const DATA_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "thread_best5_data.json"
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("프리코스7기_열정게시물")
    .setDescription(
      "프리코스 7기 기간동안 가장 반응이 좋은 게시물 5개를 보여줍니다."
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply({
        content: "데이터 확인 중입니다...",
      });

      if (
        cache.data &&
        cache.lastUpdate &&
        Date.now() - cache.lastUpdate < CACHE_EXPIRY
      ) {
        console.log("메모리 캐시된 데이터를 사용합니다.");
        await interaction.editReply({ embeds: [cache.data] });
        return;
      }

      console.log(
        `cache.data ${cache.data}\n캐시된 데이터가 없거나 유효하지 않아, 파일 및 API에서 데이터를 가져올지 확인합니다.`
      );
      let jsonData;

      try {
        const data = await fs.readFile(DATA_FILE_PATH, "utf-8");
        jsonData = JSON.parse(data);
        console.log("파일에서 데이터를 가져왔습니다.");
      } catch (err) {
        console.log(
          "파일에서 데이터를 가져오지 못했습니다. 새로운 데이터 생성을 시작합니다."
        );
        jsonData = {
          bestPosts: [],
          lastUpdated: null,
        };
      }

      if (
        jsonData.lastUpdated &&
        Date.now() - Date.parse(jsonData.lastUpdated) > CACHE_EXPIRY
      ) {
        console.log(
          "캐시 파일이 7일 이상 지났으므로, 파일 및 API에서 데이터를 가져와 캐시를 갱신합니다."
        );
        jsonData = {
          bestPosts: [],
          lastUpdated: null,
        };
      } else if (jsonData.lastUpdated) {
        console.log("캐시 파일이 7일 이내 이므로, 캐시파일에서 불러옵니다.");
        const embed = createBestPostsEmbed(
          jsonData.bestPosts,
          jsonData.lastUpdated
        );
        cache.data = embed;
        cache.lastUpdate = Date.now();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("yes")
          .setLabel("Y")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("no")
          .setLabel("N")
          .setStyle(ButtonStyle.Danger)
      );

      const response = await interaction.editReply({
        content:
          "캐시된 데이터가 없거나 유효하지 않습니다. 최신 데이터를 업데이트하시겠습니까? (Y/N)",
        components: [row],
      });

      const collectorFilter = (i) => i.user.id === interaction.user.id;

      try {
        const confirmation = await response.awaitMessageComponent({
          filter: collectorFilter,
          time: 15000,
        });

        if (confirmation.customId === "yes") {
          await interaction.editReply({
            content: "데이터를 업데이트합니다. 잠시만 기다려주세요...",
            components: [],
          });
        } else if (confirmation.customId === "no") {
          await interaction.editReply({
            content: "데이터 업데이트를 취소합니다.",
            components: [],
          });
          return;
        }
      } catch (e) {
        await interaction.editReply({
          content: "응답시간이 지났습니다. 데이터 업데이트를 취소합니다.",
          components: [],
        });
        return;
      }

      const channels = [
        process.env.CHANNEL_ID_1,
        process.env.CHANNEL_ID_2,
        process.env.CHANNEL_ID_3,
      ];

      let allPosts = [];

      for (const channelId of channels) {
        const channel = await interaction.client.channels.fetch(channelId);

        if (channel.type !== ChannelType.GuildForum) {
          console.log(
            `채널 ${channel.name} (ID: ${channel.id}) 은 포럼 채널이 아닙니다.`
          );
          continue;
        }

        const activeFetchedThreads = await channel.threads.fetchActive();
        const activeThreads = activeFetchedThreads.threads;

        const archievFetchedThreads = await channel.threads.fetchArchived();
        const archiveThreads = archievFetchedThreads.threads;

        for (const thread of activeThreads.values()) {
          try {
            const messages = await fetchAllMessages(thread);
            const messageCount = messages.length;
            let totalReactions = 0;
            for (const message of messages) {
              totalReactions += message.reactions.cache.reduce(
                (acc, reaction) => acc + reaction.count,
                0
              );
            }

            allPosts.push({
              channelName: channel.name,
              threadName: thread.name,
              author: thread.ownerId
                ? (await interaction.guild.members.fetch(thread.ownerId))
                    .displayName
                : "알 수 없음",
              messageCount,
              reactionCount: totalReactions,
              threadLink: `https://discord.com/channels/${interaction.guild.id}/${thread.id}`,
              totalScore: messageCount + totalReactions,
            });
          } catch (error) {
            console.error(
              `스레드 ${thread.name} (ID: ${thread.id}) 처리 중 오류 발생:`,
              error
            );
            continue; // 오류 발생 시 다음 스레드로 건너뜀
          }
        }
        for (const thread of archiveThreads.values()) {
          try {
            const messages = await fetchAllMessages(thread);
            const messageCount = messages.length;
            let totalReactions = 0;
            for (const message of messages) {
              totalReactions += message.reactions.cache.reduce(
                (acc, reaction) => acc + reaction.count,
                0
              );
            }

            allPosts.push({
              channelName: channel.name,
              threadName: thread.name,
              author: thread.ownerId
                ? (await interaction.guild.members.fetch(thread.ownerId))
                    .displayName
                : "알 수 없음",
              messageCount,
              reactionCount: totalReactions,
              threadLink: `https://discord.com/channels/${interaction.guild.id}/${thread.id}`,
              totalScore: messageCount + totalReactions,
            });
          } catch (error) {
            console.error(
              `스레드 ${thread.name} (ID: ${thread.id}) 처리 중 오류 발생:`,
              error
            );
            continue; // 오류 발생 시 다음 스레드로 건너뜀
          }
        }
      }

      allPosts.sort((a, b) => b.totalScore - a.totalScore);
      const bestPosts = allPosts.slice(0, 5);

      jsonData.bestPosts = bestPosts;
      jsonData.lastUpdated = new Date().toISOString();

      await fs.writeFile(
        DATA_FILE_PATH,
        JSON.stringify(jsonData, null, 2),
        "utf-8"
      );
      console.log("데이터를 파일에 저장했습니다.");

      const embed = createBestPostsEmbed(bestPosts, jsonData.lastUpdated);
      cache.data = embed;
      cache.lastUpdate = Date.now();

      await interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
      console.error("오류 발생:", error);
      await interaction.editReply({
        content: "오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};

function createBestPostsEmbed(bestPosts, lastUpdated) {
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("7기 프리코스 열정 게시물 TOP 5")
    .setDescription("가장 많은 반응과 메시지를 받은 게시물들입니다.")
    .addFields(
      ...bestPosts.map((post, index) => ({
        name: `${index + 1}위: ${post.threadName}`,
        value: [
          `채널: ${post.channelName}`,
          `👍 이모지 수: ${post.reactionCount}`,
          `💬 메시지 수: ${post.messageCount}`,
          `✍️ 작성자: ${post.author}`,
          `🔗 [게시물 바로가기](${post.threadLink})`,
        ].join("\n"),
      }))
    )
    .setTimestamp()
    .setFooter({
      text: `Developed by [FE] 민찬 | 데이터는 ${new Date(
        lastUpdated
      ).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      })}기준 업데이트`,
    });
}

async function fetchAllMessages(thread) {
  let allMessages = [];
  let lastMessageId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastMessageId) {
      options.before = lastMessageId;
    }

    const messages = await thread.messages.fetch(options);
    if (messages.size === 0) {
      break;
    }

    allMessages = allMessages.concat(Array.from(messages.values()));
    lastMessageId = messages.last().id;

    await sleep(500);
  }

  return allMessages;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
