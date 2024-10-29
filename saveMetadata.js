// saveMetadata.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const previousDataPath = path.join(dataDir, 'previousThreadData.json');
const currentDataPath = path.join(dataDir, 'currentThreadData.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
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
    // 파일 읽기
    fs.readFile(currentDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        // JSON 데이터 파싱
        const threadData = JSON.parse(data);

        // 주차별 스레드를 그룹화
        const threadsByWeek = groupThreadsByWeek(threadData);

        // 주차별로 폴더에 파일 저장
        Object.keys(threadsByWeek).forEach((weekNumber) => {
            const weekFolderName = `week${weekNumber}`; // week1, week2 같은 폴더명
            const weekFolderPath = path.join(dataDir, weekFolderName);

            // 폴더가 없으면 생성
            if (!fs.existsSync(weekFolderPath)) {
                fs.mkdirSync(weekFolderPath);
            }

            // 해당 주차의 데이터를 저장할 파일 경로
            const filePath = path.join(weekFolderPath, `${weekFolderName}-threads.json`);

            // 데이터를 파일로 저장
            fs.writeFile(filePath, JSON.stringify(threadsByWeek[weekNumber], null, 2), (err) => {
                if (err) {
                    console.error(`Error writing to file for week ${weekNumber}:`, err);
                } else {
                    console.log(`Successfully wrote data for week ${weekNumber}`);
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
    const tempDataPath = path.join(tempDir, `tempThreadData_${batchIndex}.json`);
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
