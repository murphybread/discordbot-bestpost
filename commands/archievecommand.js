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
const DATA_FILE_PATH = path.join(process.cwd(), "data", "thread_data.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("7기_프리코스_게시글_수")
    .setDescription(
      "프리코스 7기 기간동안 각 채널 및 총 생성된 게시글 수 및 메시지, 이모지 수를 보여줍니다."
    ),
  async execute(interaction) {
    try {
      // deferrReply는 3초이상 걸리는 작업에만 확인
      await interaction.deferReply({
        content: "일주일 안에 캐시된 데이터 확인 중입니다...",
      }); // 로딩 메시지 설정

      // 캐시 데이터 확인
      if (
        cache.data &&
        cache.lastUpdate &&
        Date.now() - cache.lastUpdate < CACHE_EXPIRY
      ) {
        console.log("메모리 캐시된 데이터를 사용합니다.");
        await interaction.editReply({ embeds: [cache.data] });
        return; // 캐시된 데이터 사용
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
          channels: [],
          totalThreadCount: 0,
          totalMessageCount: 0,
          totalReactionCount: 0,
          lastUpdated: null,
        };
      }

      // 파일에 저장된 데이터가 일주일 이상 지났으면 캐시를 업데이트
      if (
        jsonData.lastUpdated &&
        Date.now() - Date.parse(jsonData.lastUpdated) > CACHE_EXPIRY
      ) {
        console.log(
          "캐시 파일이 7일 이상 지났으므로, 파일 및 API에서 데이터를 가져와 캐시를 갱신합니다."
        );
        jsonData = {
          channels: [],
          totalThreadCount: 0,
          totalMessageCount: 0,
          totalReactionCount: 0,
          lastUpdated: null,
        };
      } else if (jsonData.lastUpdated) {
        console.log("캐시 파일이 7일 이내 이므로, 캐시파일에서 불러옵니다.");
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("7기 프리코스 게시글 수 요약")
          .setDescription(
            "프리코스 7기 기간동안 각 채널에 생성된 게시글 수 및 메시지, 이모지 수입니다."
          )
          .addFields(
            ...jsonData.channels.map((channel) => ({
              name: channel.name,
              value: `스레드: ${channel.threadCount} 개\n 메시지: ${channel.messageCount} 개\n 이모지: ${channel.reactionCount} 개`,
              inline: true,
            })),
            {
              name: "총 게시글 수",
              value: `${jsonData.totalThreadCount} 개`,
              inline: false,
            },
            {
              name: "총 메시지 수",
              value: `${jsonData.totalMessageCount} 개`,
              inline: false,
            },
            {
              name: "총 이모지 수",
              value: `${jsonData.totalReactionCount} 개`,
              inline: false,
            }
          )
          .setTimestamp()
          .setFooter({
            text: `Developed by [FE] 민찬 | 데이터는 ${new Date(
              jsonData.lastUpdated
            ).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })}기준 업데이트`,
          });
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

      let totalThreadCount = 0;
      let totalMessageCount = 0;
      let totalReactionCount = 0;
      const channelThreadCounts = {};
      const channelMessageCounts = {};
      const channelReactionCounts = {};

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

        console.log(
          `${channel.name} (ID: ${channel.id}) 에서 활성 스레드 ${activeThreads.size}개 발견`
        );
        console.log(
          `${channel.name} (ID: ${channel.id}) 에서 아카이빙된된 스레드 ${archiveThreads.size}개 발견`
        );

        let threadMessageCount = 0;
        let threadReactionCount = 0;

        // 활성 스레드 메시지 및 이모지 수 합산
        for (const thread of activeThreads.values()) {
          const messages = await fetchAllMessages(thread);
          const messageCount = messages.length;
          let totalReactions = 0;
          for (const message of messages) {
            totalReactions += message.reactions.cache.reduce(
              (acc, reaction) => acc + reaction.count,
              0
            );
          }
          threadMessageCount += messageCount;
          threadReactionCount += totalReactions;
        }
        // 아카이브 스레드 메시지 및 이모지 수 합산
        for (const thread of archiveThreads.values()) {
          const messages = await fetchAllMessages(thread);
          const messageCount = messages.length;
          let totalReactions = 0;
          for (const message of messages) {
            totalReactions += message.reactions.cache.reduce(
              (acc, reaction) => acc + reaction.count,
              0
            );
          }
          threadMessageCount += messageCount;
          threadReactionCount += totalReactions;
        }

        const threadCount = activeThreads.size + archiveThreads.size;

        totalMessageCount += threadMessageCount;
        totalReactionCount += threadReactionCount;
        totalThreadCount += threadCount;

        channelThreadCounts[channel.name] = threadCount;
        channelMessageCounts[channel.name] = threadMessageCount;
        channelReactionCounts[channel.name] = threadReactionCount;

        const channelIndex = jsonData.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex === -1) {
          jsonData.channels.push({
            name: channel.name,
            id: channel.id,
            threadCount: threadCount,
            messageCount: threadMessageCount,
            reactionCount: threadReactionCount,
          });
        } else {
          jsonData.channels[channelIndex].threadCount = threadCount;
          jsonData.channels[channelIndex].messageCount = threadMessageCount;
          jsonData.channels[channelIndex].reactionCount = threadReactionCount;
        }
      }

      jsonData.totalThreadCount = totalThreadCount;
      jsonData.totalMessageCount = totalMessageCount;
      jsonData.totalReactionCount = totalReactionCount;
      jsonData.lastUpdated = new Date().toISOString();

      await fs.writeFile(
        DATA_FILE_PATH,
        JSON.stringify(jsonData, null, 2),
        "utf-8"
      );
      console.log("데이터를 파일에 저장했습니다.");

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("7기 프리코스 게시글 수 요약")
        .setDescription(
          "프리코스 7기 기간동안 각 채널에 생성된 게시글 수 및 메시지, 이모지 수입니다."
        )
        .addFields(
          ...jsonData.channels.map((channel) => ({
            name: channel.name,
            value: `스레드: ${channel.threadCount} 개\n 메시지: ${channel.messageCount} 개\n 이모지: ${channel.reactionCount} 개`,
            inline: true,
          })),
          {
            name: "총 게시글 수",
            value: `${jsonData.totalThreadCount} 개`,
            inline: false,
          },
          {
            name: "총 메시지 수",
            value: `${jsonData.totalMessageCount} 개`,
            inline: false,
          },
          {
            name: "총 이모지 수",
            value: `${jsonData.totalReactionCount} 개`,
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Developed by [FE] 민찬 | 데이터는 ${new Date(
            jsonData.lastUpdated
          ).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}기준 업데이트`,
        });

      cache.data = embed;
      cache.lastUpdate = Date.now();

      await interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
      console.error("스레드 수 가져오는 중 오류 발생:", error);
      await interaction.editReply({
        content: "오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};

// Function to fetch all messages in a thread using pagination
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

// Helper function to sleep for a specified duration
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
