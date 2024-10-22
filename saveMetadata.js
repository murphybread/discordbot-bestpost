// saveMetadata.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const previousDataPath = path.join(dataDir, 'previousThreadData.json');
const currentDataPath = path.join(dataDir, 'currentThreadData.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
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
        fs.writeFileSync(currentDataPath, JSON.stringify(threadData, null, 2));
        console.log('Current thread data saved successfully.');
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

module.exports = {
    readPreviousData,
    saveCurrentData,
    updatePreviousData,
};
