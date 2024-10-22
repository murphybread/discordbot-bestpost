// compareMetadata.js

module.exports = {
    compareData: function (currentData, previousData) {
        const changes = [];

        currentData.forEach((currentThread) => {
            const previousThread = previousData.find(
                (thread) => thread.threadId === currentThread.threadId
            );

            if (previousThread) {
                const mainPostReactionChange =
                    currentThread.mainPostReactions - previousThread.mainPostReactions;
                const messageCountChange =
                    currentThread.messageCount - previousThread.messageCount;

                changes.push({
                    threadId: currentThread.threadId,
                    threadName: currentThread.threadName,
                    threadLink: currentThread.threadLink,
                    weekNumber: currentThread.weekNumber,
                    mainPostReactionChange: mainPostReactionChange,
                    messageCountChange: messageCountChange,
                });
            } else {
                // New thread since last data collection
                changes.push({
                    threadId: currentThread.threadId,
                    threadName: currentThread.threadName,
                    threadLink: currentThread.threadLink,
                    weekNumber: currentThread.weekNumber,
                    mainPostReactionChange: currentThread.mainPostReactions,
                    messageCountChange: currentThread.messageCount,
                });
            }
        });

        return changes;
    },
};
