// getMetadata.js

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js');
const { saveTempData, saveThreadsByWeekAndChannel, saveThreadsByChannel } = require('./saveMetadata');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

async function main() {
    try {
        await client.login(process.env.DISCORD_TOKEN);
        console.log('Discord 클라이언트 로그인 완료');

        const fetchedData = await module.exports.getMetadata();
        console.log('가져온 데이터:', JSON.stringify(fetchedData, null, 2));

        fetchedData.forEach(thread => {
            console.log(`Thread: ${thread.threadName}, Author: ${thread.author}`);
        });

        // Save the current data
        saveCurrentData(fetchedData);
        console.log(`채널 데이터 수집이 완료됐습니다.`);

        // 작업 완료 후 클라이언트 종료
        client.destroy();
    } catch (error) {
        console.error('Error:', error);
        client.destroy();
    }
}

// 직접 실행될 때만 main 함수 실행
if (require.main === module) {
    main().catch(error => {
        console.error('Error in main:', error);
        process.exit(1);
    });
}


module.exports = {
    client,
    getMetadata: async function () {
        try {
            const channels = [process.env.CHANNEL_ID_1, process.env.CHANNEL_ID_2, process.env.CHANNEL_ID_3];

            const allThreadData = [];

            // 각 채널 순회 처리
            for (const channelId of channels) {
                const channel = await client.channels.fetch(channelId);

                console.log(`Fetched channel: ${channel.name} (ID: ${channel.id}), Type: ${channel.type}`);

                // Check if the channel is a GUILD_FORUM
                if (channel.type !== ChannelType.GuildForum) {
                    console.log('Channel is not a forum channel. Cannot track threads in non-forum channels.');
                    continue; // 다음 채널로 넘어감
                }

                // Fetch active threads in the forum channel
                const fetchedThreads = await channel.threads.fetchActive();
                const threads = fetchedThreads.threads;

                console.log(`Successfully fetched ${threads.size} active threads in forum channel.`);

                const threadData = [];
                let batchIndex = 1;
                let i = 1;

                for (const thread of threads.values()) {
                    console.log(`\nProcessing thread: ${thread.name} (ID: ${thread.id})`);
                    console.log(`${i}번째 쓰레드 총 ${threads.size} \n`);

                    // Fetch the starter message (main post)
                    let starterMessage;
                    try {
                        starterMessage = await thread.fetchStarterMessage();
                    } catch (error) {
                        console.error(`Failed to fetch starter message for thread ${thread.name}:`, error.message);
                        starterMessage = {
                            content: "이 스레드의 시작 메시지를 가져오지 못했습니다.", // Dummy message content
                            author: { username: "Unknown Author" }, // Dummy author
                            reactions: {
                                cache: new Map([]), // Initialize reactions as an empty Map
                            },
                        };
                    }

                    const mainPostReactions = starterMessage.reactions.cache.size > 0
                        ? Array.from(starterMessage.reactions.cache.values()).reduce(
                            (acc, reaction) => acc + reaction.count,
                            0
                        )
                        : 0;

                    // Fetch all messages in the thread
                    const messages = await fetchAllMessages(thread);
                    const messageCount = messages.length - 1; // Subtracting 1 to exclude the starter message

                    let totalReactions = 0;
                    for (const message of messages) {
                        const reactionCount = message.reactions.cache.reduce(
                            (acc, reaction) => acc + reaction.count,
                            0
                        );
                        totalReactions += reactionCount;
                    }


                    const threadMetadata = await getThreadMetadata(thread);

                    threadData.push(threadMetadata);

                    // Save every 10 threads
                    if (i % 10 === 0) {
                        const batchData = threadData.slice((batchIndex - 1) * 10, batchIndex * 10);
                        saveTempData(batchData, batchIndex++); // Save the batch
                    }
                    i++;
                }

                saveThreadsByChannel(threadData);
                // 각 채널 json 저장
                saveThreadsByWeekAndChannel(threadData)
                // 각 채널의 스레드 데이터를 allThreadData에 추가
                allThreadData.push(...threadData);
            }


            return allThreadData;
        } catch (error) {
            console.error(`Failed to fetch threads:`, error.message);
            console.error('Stack trace:', error.stack);
            if (error.rawError) {
                console.error('Raw error details:', JSON.stringify(error.rawError, null, 2));
            }
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

        // Optional: Wait to avoid hitting rate limits
        await sleep(1000); // Wait for 1 second
    }

    return allMessages;
}

// Helper function to sleep for a specified duration
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getThreadMetadata(thread) {
    const startDate = new Date('2024-10-15T00:00:00.00+09:00');
    const threadCreatedAt = new Date(thread.createdAt);
    const weekNumber = Math.ceil((threadCreatedAt - startDate) / (7 * 24 * 60 * 60 * 1000));
    const threadCreatedAtKST = threadCreatedAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });


    let messageFailed = false;
    try {
        messages = await thread.messages.fetch({ limit: 100 });
    } catch (error) {
        console.error(`Failed to fetch messages for thread ${thread.id}: ${error}`);
        messageFailed = true;
    }

    // console.log(`messages: ${JSON.stringify(Array.from(messages.values()), null, 2)}`);
    console.log(`messages.size : ${messages.size}`)
    const mainPost = !messageFailed && messages.size ? messages.last() : { reactions: { cache: new Map() } }; // Mock main post if no messages

    const mainPostReactions = !messageFailed && messages.size ?
        mainPost.reactions.cache.reduce((acc, reaction) => acc + reaction.count, 0) :
        0;

    const totalReactions = !messageFailed && messages.size ?
        messages.reduce((acc, message) =>
            acc + message.reactions.cache.reduce((reactionAcc, reaction) => reactionAcc + reaction.count, 0), 0) :
        0

    let authorName = 'Unknown';
    try {
        const starterMessage = await thread.fetchStarterMessage();
        if (starterMessage) {
            authorName = starterMessage.author.displayName;
        } else {
            console.log('스레드 시작 메시지를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error(`스레드 ${thread.id}의 시작 메시지를 가져오는 데 실패했습니다:`, error);
        // Mocking starterMessage in case of failureㅎ
        starterMessage = {
            author: { username: "Unknown Author" },
            reactions: { cache: new Map() },
        };
        authorName = starterMessage.author.username;
    }

    return {
        channelId: thread.parentId,
        channelName: thread.parent.name,
        threadId: thread.id,
        threadName: thread.name,
        threadLink: `https://discord.com/channels/${thread.guild.id}/${thread.id}`,
        creationDate: threadCreatedAtKST,
        weekNumber,
        mainPostReactions,
        totalReactions,
        messageCount: messages.size,
        author: authorName,
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('이번주추천')
        .setDescription('이번 주의 추천 게시물을 보여줍니다')
        .addStringOption(option =>
            option.setName('채널')
                .setDescription('채널 선택')
                .setRequired(true)
                .addChoices(
                    { name: '함께-나누기', value: '📚│함께-나누기' },
                    { name: '토론하기', value: '🚀│토론하기' },
                    { name: '다시-돌아보기', value: '🧘│다시-돌아보기' },
                ))
        .addStringOption(option =>
            option.setName('주차')
                .setDescription('주차 선택 (미선택시 현재 주차)')
                .addChoices(
                    { name: '0주차', value: 'week0' },
                    { name: '1주차', value: 'week1' },
                    { name: '2주차', value: 'week2' },
                    { name: '3주차', value: 'week3' },
                )),

    async execute(interaction) {
        try {
            const channel = interaction.options.getString('채널');
            const week = interaction.options.getString('주차') || getCurrentWeek();

            // 임베드 색상 설정
            const colorMap = {
                '📚│함께-나누기': 0x00ff00,  // 초록색
                '🚀│토론하기': 0x0099ff,    // 파란색
                '🧘│다시-돌아보기': 0xff9900 // 주황색
            };

            // 파일 경로 설정
            const filePath = path.join(
                process.cwd(),
                'data',
                `channel_${channel}`,
                week,
                `${week}-top5FormattedPosts.json`
            );

            // 파일 읽기 시도
            let posts;
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                posts = JSON.parse(data);
            } catch (error) {
                return await interaction.reply({
                    content: `${week}의 ${channel} 채널 데이터가 아직 없습니다.`,
                    ephemeral: true
                });
            }

            // Discord 임베드 메시지 생성
            const embed = {
                color: colorMap[channel] || 0x0099ff,
                title: `${channel} 채널의 ${week} 추천 게시물 TOP 5`,
                description: '가장 많은 반응과 댓글을 받은 게시물들입니다.',
                fields: posts.map((post, index) => ({
                    name: `${index + 1}위: ${post.게시물제목}`,
                    value: [
                        `👍 반응: ${post.총_이모지_리액션_수}`,
                        `💬 댓글: ${post.총_메시지_수}`,
                        `✍️ 작성자: ${post.작성자}`,
                        `🔗 [게시물 바로가기](${post.링크})`
                    ].join('\n')
                })),
                timestamp: new Date(),
                footer: {
                    text: '디스코드 도서관 | 매주 업데이트'
                }
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: '데이터를 불러오는 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    },
};