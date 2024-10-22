// main.js

require('dotenv').config();
const { client, getMetadata } = require('./getMetadata');
const {
    readPreviousData,
    saveCurrentData,
    updatePreviousData,
} = require('./saveMetadata');
const { compareData } = require('./compareMetadata');

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN);

// When the client is ready, run this code
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Fetch and save thread metadata
    const threadData = await getMetadata();

    console.log('Thread data fetched:', threadData);

    // Save the current data
    saveCurrentData(threadData);

    // Group threads by week
    const threadsByWeek = groupThreadsByWeek(threadData);

    // Analyze data per week
    analyzeThreadsByWeek(threadsByWeek);

    // ... existing code for comparison, if needed ...
});

// Function to group threads by week
function groupThreadsByWeek(threadData) {
    const threadsByWeek = {};

    threadData.forEach((thread) => {
        const weekNumber = thread.weekNumber || 0;
        if (!threadsByWeek[weekNumber]) {
            threadsByWeek[weekNumber] = [];
        }
        threadsByWeek[weekNumber].push(thread);
    });

    return threadsByWeek;
}

// Function to analyze threads by week
function analyzeThreadsByWeek(threadsByWeek) {
    for (const week in threadsByWeek) {
        const threads = threadsByWeek[week];

        console.log(`\n--- Week ${week} ---`);

        // Sort threads by total reactions
        const sortedByReactions = threads
            .slice()
            .sort((a, b) => b.totalReactions - a.totalReactions);

        // Sort threads by message count
        const sortedByMessages = threads
            .slice()
            .sort((a, b) => b.messageCount - a.messageCount);

        console.log('Top threads by total reactions:');
        sortedByReactions.forEach((thread, index) => {
            console.log(
                `${index + 1}. Thread: ${thread.threadName} (ID: ${thread.threadId})`
            );
            console.log(`   Total Reactions: ${thread.totalReactions}`);
            console.log(`   Created On: ${thread.creationDate.toDateString()}`);
            console.log(`   Link: ${thread.threadLink}`);
        });

        console.log('\nTop threads by message count:');
        sortedByMessages.forEach((thread, index) => {
            console.log(
                `${index + 1}. Thread: ${thread.threadName} (ID: ${thread.threadId})`
            );
            console.log(`   Messages: ${thread.messageCount}`);
            console.log(`   Created On: ${thread.creationDate.toDateString()}`);
            console.log(`   Link: ${thread.threadLink}`);
        });
    }
}
