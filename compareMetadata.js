const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const weekFolder = 'week2';  // You can change this to 'week2', 'week3', etc.
const weekFile = `${weekFolder}-threads.json`;  // File name based on weekFolder

function getPath(directoryName, fileName) {
    return path.join(__dirname, 'data', directoryName, fileName);
}

// 현재 데이터를 읽고 상위 5개 게시물을 저장하는 함수
function saveTop5Posts(threadData, weekFolder) {
    const dataDir = path.join(__dirname, 'data', weekFolder);

    const top5Posts = threadData
        .sort((a, b) => (b.totalReactions + b.messageCount) - (a.totalReactions + a.messageCount))
        .slice(0, 5); // 상위 5개 선택


    const top5FileName = `${weekFolder}-top5Posts.json`;
    const top5Path = path.join(dataDir, top5FileName);  // week1-top5Posts.json 형태

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFile(top5Path, JSON.stringify(top5Posts, null, 2), (err) => {
        if (err) {
            console.error(`Error writing top 5 posts to ${weekFolder}:`, err);
        } else {
            console.log(`Successfully saved top 5 posts in ${weekFolder} folder!`);
        }
    });
}

// 비동기적으로 파일을 읽어온 후 저장하는 방식
const data = fs.readFileSync(getPath(weekFolder, weekFile), 'utf-8');
const threadData = JSON.parse(data);
saveTop5Posts(threadData, weekFolder);


