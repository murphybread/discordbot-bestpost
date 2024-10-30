const fs = require('fs');
const path = require('path');

// Helper: 폴더와 파일 경로 생성
function getPath(channelKey, weekFolder, fileName) {
    return path.join(process.cwd(), 'data', channelKey, weekFolder, fileName);
}

// Function to save top 5 posts for each channel and week
function saveTop5PostsByChannelAndWeek(threads) {
    // 채널과 주차별로 스레드를 그룹화
    const threadsByChannelAndWeek = threads.reduce((acc, thread) => {
        const { channelName, weekNumber } = thread;
        const key = `channel_${channelName}:::week${weekNumber}`;

        if (!acc[key]) acc[key] = [];
        acc[key].push(thread);

        return acc;
    }, {});

    // 각 채널과 주차별로 상위 5개 게시물 저장
    Object.keys(threadsByChannelAndWeek).forEach((key) => {
        const [channelPart, weekFolder] = key.split(':::');
        const dataDir = path.join(process.cwd(), 'data', channelPart, weekFolder);

        // 상위 5개 게시물 선택
        const top5Posts = threadsByChannelAndWeek[key]
            .sort((a, b) => (b.totalReactions + b.messageCount) - (a.totalReactions + a.messageCount))
            .slice(0, 5);

        const top5FileName = `${weekFolder}-top5Posts.json`;
        const top5Path = getPath(channelPart, weekFolder, top5FileName);

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        try {
            fs.writeFileSync(top5Path, JSON.stringify(top5Posts, null, 2));
            console.log(`Successfully saved top 5 posts for ${key}`);
        } catch (err) {
            console.error(`Error writing top 5 posts for ${key}:`, err);
        }
    });
}

// Function to save formatted top 5 posts for each channel and week
function saveFormattedTop5Posts(threads) {
    // 채널과 주차별로 스레드를 그룹화
    const threadsByChannelAndWeek = threads.reduce((acc, thread) => {
        const { channelName, weekNumber } = thread;
        const key = `channel_${channelName}:::week${weekNumber}`;

        if (!acc[key]) acc[key] = [];
        acc[key].push(thread);

        return acc;
    }, {});

    // 각 채널과 주차별로 포맷된 상위 5개 게시물 저장
    Object.keys(threadsByChannelAndWeek).forEach((key) => {
        const [channelPart, weekFolder] = key.split(':::');
        const dataDir = path.join(__dirname, channelPart, weekFolder);

        const top5FileName = `${weekFolder}-top5Posts.json`;
        const formattedFileName = `${weekFolder}-top5FormattedPosts.json`;
        const top5Path = getPath(channelPart, weekFolder, top5FileName);
        const formattedPath = getPath(channelPart, weekFolder, formattedFileName);

        let top5Data;
        try {
            top5Data = JSON.parse(fs.readFileSync(top5Path, 'utf-8'));
        } catch (err) {
            console.error(`Error reading top 5 posts file for ${key}:`, err);
            return;
        }

        const formattedData = top5Data.map(post => ({
            게시물제목: post.threadName,
            총_이모지_리액션_수: post.totalReactions,
            총_메시지_수: post.messageCount,
            링크: post.threadLink,
            작성자: post.author
        }));

        try {
            fs.writeFileSync(formattedPath, JSON.stringify(formattedData, null, 2));
            console.log(`Successfully saved formatted top 5 posts for ${key}`);
        } catch (err) {
            console.error(`Error writing formatted top 5 posts for ${key}:`, err);
        }
    });
}

// threads 데이터를 파일에서 불러오기
// threads 데이터를 파일에서 불러오기
function loadThreadsFromFile() {
    const dataDir = path.join(process.cwd(), 'data');
    let allThreads = [];

    // 디렉토리 내의 모든 파일과 폴더를 순회
    const items = fs.readdirSync(dataDir);
    console.log(`Data directory items: ${items}`); // 데이터 디렉토리 항목 출력

    items.forEach((item) => {
        const itemPath = path.join(dataDir, item);
        console.log(`Processing item: ${itemPath}`); // 현재 처리 중인 항목 경로 출력

        // 파일인지 폴더인지 확인
        if (fs.statSync(itemPath).isDirectory()) {
            console.log(`Directory found: ${itemPath}`); // 디렉토리 확인 로그
            // 각 채널 폴더 내의 주차 폴더 순회
            const weekFolders = fs.readdirSync(itemPath);
            console.log(`Week folders in ${itemPath}: ${weekFolders}`); // 주차 폴더 목록 출력

            weekFolders.forEach((weekFolder) => {
                const weekPath = path.join(itemPath, weekFolder);

                // 주차 폴더 내의 모든 JSON 파일을 탐색
                const filesInWeekFolder = fs.readdirSync(weekPath).filter(file => file.endsWith('.json'));
                console.log(`JSON files in ${weekPath}: ${filesInWeekFolder}`); // 주차 폴더 내 파일 목록 출력

                filesInWeekFolder.forEach((fileName) => {
                    const threadFile = path.join(weekPath, fileName);
                    console.log(`Looking for thread file: ${threadFile}`); // 찾고 있는 파일 경로 출력

                    if (fs.existsSync(threadFile)) {
                        try {
                            const data = fs.readFileSync(threadFile, 'utf-8');
                            const threads = JSON.parse(data);
                            console.log(`Loaded threads from ${threadFile}`); // 파일에서 스레드 로드 성공 로그
                            allThreads.push(...threads); // 모든 스레드를 모아서 배열에 저장
                        } catch (err) {
                            console.error(`Error reading file: ${threadFile}`, err); // 파일 읽기 오류 로그
                        }
                    }
                });
            });
        } else {
            console.log(`${item}은(는) 파일이므로 무시합니다.`); // 파일일 때 무시하는 로그
        }
    });

    return allThreads;
}
const threads = loadThreadsFromFile();
console.log(threads);
saveTop5PostsByChannelAndWeek(threads);
saveFormattedTop5Posts(threads);
