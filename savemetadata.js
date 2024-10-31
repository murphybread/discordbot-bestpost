// saveMetadata.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const channelDir = path.join(__dirname, 'channels');
const previousDataPath = path.join(dataDir, 'previousThreadData.json');
const currentDataPath = path.join(dataDir, 'currentThreadData.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

function sanitizeFolderName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '');
}

// Function to group threads by week and write to respective folders
function saveThreadsByWeekAndChannel(threads) {
    const threadsByWeekAndChannel = {};

    // 주차별로 스레드를 그룹화
    threads.forEach((thread) => {
        const weekNumber = thread.weekNumber;
        const channelName = thread.channelName;
        const sanitizedChannelName = sanitizeFolderName(channelName); // 채널 이름을 안전하게 변환

        // 주차별로 채널 내 스레드를 그룹화
        if (!threadsByWeekAndChannel[weekNumber]) {
            threadsByWeekAndChannel[weekNumber] = {};
        }
        if (!threadsByWeekAndChannel[weekNumber][sanitizedChannelName]) {
            threadsByWeekAndChannel[weekNumber][sanitizedChannelName] = [];
        }

        threadsByWeekAndChannel[weekNumber][sanitizedChannelName].push(thread);
    });

    // 그룹화된 스레드들을 저장
    Object.keys(threadsByWeekAndChannel).forEach((weekNumber) => {
        Object.keys(threadsByWeekAndChannel[weekNumber]).forEach((sanitizedChannelName) => {
            const weekFolderName = `week${weekNumber}`;
            const channelFolderPath = path.join(dataDir, `channel_${sanitizedChannelName}`, weekFolderName);

            if (!fs.existsSync(channelFolderPath)) {
                fs.mkdirSync(channelFolderPath, { recursive: true }); // 폴더가 없으면 생성
            }

            const filePath = path.join(channelFolderPath, `${weekFolderName}-${sanitizedChannelName}.json`);
            const threadsToWrite = threadsByWeekAndChannel[weekNumber][sanitizedChannelName];

            fs.writeFile(filePath, JSON.stringify(threadsToWrite, null, 2), (err) => {
                if (err) {
                    console.error(`Error writing to file for week ${weekNumber}:`, err);
                } else {
                    console.log(`Successfully wrote data for week ${weekNumber} in channel ${sanitizedChannelName}`);
                }
            });
        });
    });
}

// Function to save all threads by channel in channel/channelName.json
function saveThreadsByChannel(thread) {
    const sanitizedChannelName = sanitizeFolderName(thread[0].channelName); // 첫 번째 스레드에서 채널 이름을 추출
    const channelFolderPath = path.join(channelDir, `channel_${sanitizedChannelName}`);
    const filePath = path.join(channelFolderPath, `${sanitizedChannelName}.json`);

    if (!fs.existsSync(channelFolderPath)) {
        fs.mkdirSync(channelFolderPath, { recursive: true }); // 폴더가 없으면 생성
    }

    // 받은 데이터를 통째로 JSON 파일로 저장
    fs.writeFile(filePath, JSON.stringify(thread, null, 2), (err) => {
        if (err) {
            console.error(`Error writing to file for channel ${sanitizedChannelName}:`, err);
        } else {
            console.log(`Successfully wrote data for channel ${sanitizedChannelName}`);
        }
    });
}



function saveCurrentData(threadData) {
    try {
        console.log(`+++++++++++++++++ start saveCurrentData ++++++++++++++++ `)
        fs.writeFileSync(currentDataPath, JSON.stringify(threadData, null, 2));
        console.log('------------------- Current thread data saved successfully.----------------');
    } catch (err) {
        console.error('Error saving current thread data:', err);
    }
}

function updatePreviousData(threadData) {
    try {
        fs.writeFileSync(previousDataPath, JSON.stringify(threadData, null, 2));
        console.log('Previous thread data updated for next comparison.');
    } catch (err) {
        console.error('Error updating previous thread data:', err);
    }
}

const tempDir = path.join(__dirname, 'temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

function saveTempData(threadData, batchIndex) {
    const tempDataPath = path.join(tempDir, `temp-${threadData[0].channelName}-ThreadData_${batchIndex}.json`);
    try {
        console.log(`+++++++++++++++++ start saving temp data for batch ${batchIndex} ++++++++++++++++`);
        fs.writeFileSync(tempDataPath, JSON.stringify(threadData, null, 2));
        console.log(`------------------- Temp thread data for batch ${batchIndex} saved successfully. ----------------`);
    } catch (err) {
        console.error(`Error saving temp data for batch ${batchIndex}:`, err);
    }
}

module.exports = {
    saveCurrentData,
    updatePreviousData,
    saveTempData,
    saveThreadsByWeekAndChannel,
    saveThreadsByChannel,
};
