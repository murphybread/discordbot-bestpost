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
            const channel = await client.channels.fetch(process.env.CHANNEL_ID);

            console.log(`Fetched channel: ${channel.name} (ID: ${channel.id}), Type: ${channel.type}`);

            // Check if the channel is a GUILD_FORUM
            if (channel.type !== ChannelType.GuildForum) {
                console.log('Channel is not a forum channel. Cannot track threads in non-forum channels.');
                return [];
            }

            // Fetch active threads (posts) in the forum channel
            const fetchedThreads = await channel.threads.fetchActive();
            const threads = fetchedThreads.threads;

            console.log(`Successfully fetched ${threads.size} active threads in forum channel.`);

            const threadData = [];
            let batchIndex = 1;
            let i = 1;

            for (const thread of threads.values()) {
                console.log(`\nProcessing thread: ${thread.name} (ID: ${thread.id})`);
                console.log(`${i}번째 쓰레드\n`);


                // Fetch the starter message (main post) within try-catch
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

                if (!starterMessage) {
                    console.log(`Could not fetch starter message for thread ${thread.name}`);
                }

                // Get the number of reactions on the starter message
                const mainPostReactions = starterMessage.reactions.cache.size > 0
                    ? Array.from(starterMessage.reactions.cache.values()).reduce(
                        (acc, reaction) => acc + reaction.count,
                        0
                    )
                    : 0;

                console.log(`Main post reactions in thread ${thread.name}: ${mainPostReactions}`);

                // Fetch all messages in the thread
                const messages = await fetchAllMessages(thread);
                console.log(`Fetched ${messages.length} messages in thread ${thread.name}`);

                // The number of messages in the thread (excluding the starter message)
                const messageCount = messages.length - 1; // Subtracting 1 to exclude the starter message

                console.log(`Number of messages in thread ${thread.name}: ${messageCount}`);

                // Optionally, calculate total reactions in all messages
                let totalReactions = 0;
                for (const message of messages) {
                    const reactionCount = message.reactions.cache.reduce(
                        (acc, reaction) => acc + reaction.count,
                        0
                    );
                    totalReactions += reactionCount;
                }

                console.log(`Total reactions in thread ${thread.name}: ${totalReactions}`);

                // Construct the thread link
                const threadLink = `https://discord.com/channels/${thread.guild.id}/${thread.id}`;

                // Get the thread creation date
                const creationDate = thread.createdAt; // This is a Date object

                // Determine the week number
                const weekNumber = getWeekNumber(creationDate);

                console.log(
                    `Thread ${thread.name} was created on ${creationDate.toDateString()}, Week ${weekNumber}`
                );

                const threadMetadata = await getThreadMetadata(thread);
                threadData.push(threadMetadata);

                console.log('Thread metadata:', threadMetadata); // 디버깅을 위해 추가

                // Save every 10 threads
                if (i % 10 === 0) {
                    const batchData = threadData.slice((batchIndex - 1) * 10, batchIndex * 10); // Get the last 10 threads
                    saveTempData(batchData, batchIndex++); // Save the batch
                }
                else if ((i >= thread.size) && (thread.size % 10 !== 0)) {
                    const batchData = threadData.slice(i * 10, thread.size); // Get the last 10 threads
                    saveTempData(batchData, batchIndex++); // Save the batch

                }
                i++;
            }

            return threadData;
        } catch (error) {
            console.error(`Failed to fetch threads:`, error.message);
            console.error('Stack trace:', error.stack);  // 에러 스택 확인
            if (error.rawError) {
                console.error('Raw error details:', JSON.stringify(error.rawError, null, 2)); // Discord에서 제공하는 원시 에러
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
    // Define your weekly intervals
    const weeks = [
        {
            weekNumber: 1,
            startDate: new Date('2023-10-15T00:00:00'), // Adjust the year and date as needed
            endDate: new Date('2023-10-21T23:59:59'),
        },
        {
            weekNumber: 2,
            startDate: new Date('2023-10-22T00:00:00'),
            endDate: new Date('2023-10-28T23:59:59'),
        },
        {
            weekNumber: 3,
            startDate: new Date('2023-10-29T00:00:00'),
            endDate: new Date('2023-11-04T23:59:59'),
        },
        {
            weekNumber: 4,
            startDate: new Date('2023-11-05T00:00:00'),
            endDate: new Date('2023-11-11T23:59:59'),
        },
    ];

    // Iterate over the weeks to find where the creationDate falls
    for (const week of weeks) {
        if (creationDate >= week.startDate && creationDate <= week.endDate) {
            return week.weekNumber;
        }
    }

    // If not found in any week, return 0 or undefined
    return 0;
}

async function getThreadMetadata(thread) {
    const startDate = new Date('2024-10-15T00:00:00.000Z');
    const threadCreatedAt = new Date(thread.createdAt);
    const weekNumber = Math.ceil((threadCreatedAt - startDate) / (7 * 24 * 60 * 60 * 1000));


    let messageFailed = false;
    try {
        messages = await thread.messages.fetch({ limit: 100 });
    } catch (error) {
        console.error(`Failed to fetch messages for thread ${thread.id}:`, error);
        messageFailed = true;
    }

    const mainPost = !messageFailed ? messages.last() : { reactions: { cache: new Map() } }; // Mock main post if no messages

    const mainPostReactions = !messageFailed ?
        mainPost.reactions.cache.reduce((acc, reaction) => acc + reaction.count, 0) :
        0;

    const totalReactions = !messageFailed ?
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
        // Mocking starterMessage in case of failure
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
        creationDate: thread.createdAt.toISOString(),
        weekNumber,
        mainPostReactions,
        totalReactions,
        author: authorName,
    };
}
