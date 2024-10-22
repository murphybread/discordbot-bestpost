// getMetadata.js

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
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

            for (const thread of threads.values()) {
                console.log(`Processing thread: ${thread.name} (ID: ${thread.id})`);

                // Fetch the starter message (main post)
                const starterMessage = await thread.fetchStarterMessage();
                if (!starterMessage) {
                    console.log(`Could not fetch starter message for thread ${thread.name}`);
                    continue;
                }

                // Get the number of reactions on the starter message
                const mainPostReactions = starterMessage.reactions.cache.reduce(
                    (acc, reaction) => acc + reaction.count,
                    0
                );

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

                // Add data to the array
                threadData.push({
                    threadId: thread.id,
                    threadName: thread.name,
                    threadLink: threadLink,
                    creationDate: creationDate,
                    weekNumber: weekNumber,
                    mainPostReactions: mainPostReactions,
                    messageCount: messageCount,
                    totalReactions: totalReactions,
                });
            }

            return threadData;
        } catch (error) {
            console.log('Failed to fetch threads:', error.message);
            return [];
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
