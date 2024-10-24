// main.js

require('dotenv').config();
const { client, getMetadata } = require('./getmetadata');
const {
    readPreviousData,
    saveCurrentData,
    updatePreviousData,
} = require('./saveMetadata');
const { compareData } = require('./compareMetadata');

async function main() {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('Discord 클라이언트 로그인 완료');

    const fetchedData = await getMetadata();
    console.log('가져온 데이터:', JSON.stringify(fetchedData, null, 2));

    fetchedData.forEach(thread => {
        console.log(`Thread: ${thread.threadName}, Author: ${thread.author}`);
    });

    // Save the current data
    saveCurrentData(fetchedData);

    // Group threads by week
    const threadsByWeek = groupThreadsByWeek(fetchedData);

    // Analyze data per week
    analyzeThreadsByWeek(threadsByWeek);

    // ... existing code for comparison, if needed ...
}

main().catch(console.error);

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
            console.log(`   Author: ${thread.author}`); // Log author (nickname)
            console.log(`   Total Reactions: ${thread.totalReactions}`);
            console.log(`   Created On: ${new Date(thread.creationDate).toDateString()}`);
            console.log(`   Link: ${thread.threadLink}`);
        });

        console.log('\nTop threads by message count:');
        sortedByMessages.forEach((thread, index) => {
            console.log(
                `${index + 1}. Thread: ${thread.threadName} (ID: ${thread.threadId})`
            );
            console.log(`   Author: ${thread.author}`); // Log author (nickname)
            console.log(`   Messages: ${thread.messageCount}`);
            console.log(`   Created On: ${new Date(thread.creationDate).toDateString()}`);
            console.log(`   Link: ${thread.threadLink}`);
        });
    }
}
