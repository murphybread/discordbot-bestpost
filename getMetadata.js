// getMetadata.js

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js');
const { saveTempData } = require('./saveMetadata');

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
                    console.log(`${i}번째 쓰레드\n 총 ${threads.size}`);

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

                    const threadLink = `https://discord.com/channels/${thread.guild.id}/${thread.id}`;
                    const creationDate = thread.createdAt;
                    const weekNumber = getWeekNumber(creationDate);

                    const threadMetadata = {
                        channelId: channel.id,
                        channelName: channel.name,
                        threadId: thread.id,
                        threadName: thread.name,
                        threadLink: threadLink,
                        creationDate: creationDate,
                        weekNumber: weekNumber,
                        mainPostReactions: mainPostReactions,
                        totalReactions: totalReactions,
                        messageCount: messageCount,
                        author: starterMessage.author.username,
                    };

                    threadData.push(threadMetadata);

                    // Save every 10 threads
                    if (i % 10 === 0) {
                        const batchData = threadData.slice((batchIndex - 1) * 10, batchIndex * 10);
                        saveTempData(batchData, batchIndex++); // Save the batch
                    }
                    i++;
                }

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

// Function to determine the week number based on the creation date
function getWeekNumber(creationDate) {
    // KST 시간으로 변환
    const kstCreationDate = new Date(creationDate).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // Define your weekly intervals based on KST
    const weeks = [
        {
            weekNumber: 1,
            startDate: new Date('2023-10-15T00:00:00+09:00'), // KST 기준 시작 시간
            endDate: new Date('2023-10-21T23:59:59+09:00'),   // KST 기준 종료 시간
        },
        {
            weekNumber: 2,
            startDate: new Date('2023-10-22T00:00:00+09:00'),
            endDate: new Date('2023-10-28T23:59:59+09:00'),
        },
        {
            weekNumber: 3,
            startDate: new Date('2023-10-29T00:00:00+09:00'),
            endDate: new Date('2023-11-04T23:59:59+09:00'),
        },
        {
            weekNumber: 4,
            startDate: new Date('2023-11-05T00:00:00+09:00'),
            endDate: new Date('2023-11-11T23:59:59+09:00'),
        },
    ];

    // Iterate over the weeks to find where the creationDate falls
    for (const week of weeks) {
        if (new Date(kstCreationDate) >= week.startDate && new Date(kstCreationDate) <= week.endDate) {
            return week.weekNumber;
        }
    }

    // If not found in any week, return 0 or undefined
    return 0;
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
    console.log(`Object.keys(messages).length: ${Object.keys(messages).length} ,  messages.length:${messages.length},messages.size : ${messages.size}`)
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
            authorName = starterMessage.author.username;
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
