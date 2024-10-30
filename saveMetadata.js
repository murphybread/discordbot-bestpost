// saveMetadata.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const previousDataPath = path.join(dataDir, 'previousThreadData.json');
const currentDataPath = path.join(dataDir, 'currentThreadData.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

function sanitizeFolderName(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, ''); // 파일 시스템에서 허용되지 않는 문자 제거
}


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

// Function to group threads by week and write to respective folders
function groupThreadsByWeekAndSave() {
    fs.readFile(currentDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        const threadData = JSON.parse(data);
        const threadsByWeek = groupThreadsByWeek(threadData);

        Object.keys(threadsByWeek).forEach((weekNumber) => {
            const weekFolderName = `week${weekNumber}`;
            const sanitizedChannelName = sanitizeFolderName(threadData[0].channelName); // 채널 이름을 안전하게 변환
            const channelFolderPath = path.join(dataDir, `channel_${sanitizedChannelName}`, weekFolderName);

            if (!fs.existsSync(channelFolderPath)) {
                fs.mkdirSync(channelFolderPath, { recursive: true }); // 폴더가 없으면 생성
            }

            const filePath = path.join(channelFolderPath, `${weekFolderName}-threads.json`);

            fs.writeFile(filePath, JSON.stringify(threadsByWeek[weekNumber], null, 2), (err) => {
                if (err) {
                    console.error(`Error writing to file for week ${weekNumber}:`, err);
                } else {
                    console.log(`Successfully wrote data for week ${weekNumber} in channel ${sanitizedChannelName}`);
                }
            });
        });
    });
}

function readPreviousData() {
    let previousData = [];

    try {
        if (fs.existsSync(previousDataPath)) {
            const data = fs.readFileSync(previousDataPath, 'utf-8');
            previousData = JSON.parse(data);
            console.log('Previous thread data loaded successfully.');
        } else {
            console.log('No previous thread data found. Starting fresh.');
        }
    } catch (err) {
        console.error('Error reading previous thread data:', err);
    }

    return previousData;
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
    readPreviousData,
    saveCurrentData,
    updatePreviousData,
    saveTempData,
    groupThreadsByWeekAndSave,
};
