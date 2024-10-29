const fs = require('fs');
const path = require('path');

const weekFolder = 'week1';  // You can change this to 'week2', 'week3', etc.
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

    try {
        fs.writeFileSync(top5Path, JSON.stringify(top5Posts, null, 2));
        console.log(`Successfully saved top 5 posts in ${weekFolder} folder!`);
    } catch (err) {
        console.error(`Error writing top 5 posts to ${weekFolder}:`, err);
    }
}

const data = fs.readFileSync(getPath(weekFolder, weekFile), 'utf-8');
const threadData = JSON.parse(data);
saveTop5Posts(threadData, weekFolder);

function saveBest5PostsFormatted(week) {
    const dataPath = getPath(week, `${week}-top5Posts.json`);
    const outputPath = getPath(week, `${week}-top5FormattedPosts.json`);

    // 파일을 읽고 상위 5개의 게시물을 출력
    let top5Data;
    try {
        top5Data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } catch (err) {
        console.error(`Error reading or parsing top 5 posts file:`, err);
        return;
    }

    // JSON 형식의 데이터로 변환
    const formattedData = top5Data.map(post => ({
        게시물제목: post.threadName,
        총_이모지_리액션_수: post.totalReactions,
        총_메시지_수: post.messageCount,
        링크: post.threadLink
    }));

    // JSON 형식으로 파일 저장
    try {
        fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2)); // JSON 형식으로 저장
        console.log(`Successfully saved formatted top 5 posts in ${week} folder as JSON!`);
    } catch (err) {
        console.error(`Error writing formatted top 5 posts to ${week}:`, err);
    }
}


saveBest5PostsFormatted(weekFolder);
