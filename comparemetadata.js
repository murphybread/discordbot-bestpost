const fs = require("fs");
const path = require("path");

// Helper: 폴더와 파일 경로 생성
function getPath(channelKey, weekFolder, fileName) {
  return path.join(process.cwd(), "data", channelKey, weekFolder, fileName);
}

function saveTop5PostsByChannelAndWeek(threads) {
  // threadId를 기준으로 중복 제거
  const uniqueThreads = Array.from(
    new Map(threads.map((thread) => [thread.threadId, thread])).values()
  );

  // 채널과 주차별로 스레드를 그룹화
  const threadsByChannelAndWeek = uniqueThreads.reduce((acc, thread) => {
    const { channelName, weekNumber } = thread;
    const key = `channel_${channelName}:::week${weekNumber}`;

    if (!acc[key]) acc[key] = [];
    acc[key].push(thread);

    return acc;
  }, {});

  // 각 채널과 주차별로 상위 5개 게시물 저장
  Object.keys(threadsByChannelAndWeek).forEach((key) => {
    const [channelPart, weekFolder] = key.split(":::");
    const dataDir = path.join(process.cwd(), "data", channelPart, weekFolder);

    // 상위 5개 게시물 선택
    const top5Posts = threadsByChannelAndWeek[key]
      .sort(
        (a, b) =>
          b.totalReactions +
          b.messageCount -
          (a.totalReactions + a.messageCount)
      )
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
    const [channelPart, weekFolder] = key.split(":::");
    const dataDir = path.join(__dirname, channelPart, weekFolder);

    const top5FileName = `${weekFolder}-top5Posts.json`;
    const formattedFileName = `${weekFolder}-top5FormattedPosts.json`;
    const top5Path = getPath(channelPart, weekFolder, top5FileName);
    const formattedPath = getPath(channelPart, weekFolder, formattedFileName);

    let top5Data;
    try {
      top5Data = JSON.parse(fs.readFileSync(top5Path, "utf-8"));
    } catch (err) {
      console.error(`Error reading top 5 posts file for ${key}:`, err);
      return;
    }

    const formattedData = top5Data.map((post) => ({
      threadName: post.threadName,
      totalReactions: post.totalReactions,
      messageCount: post.messageCount,
      threadLink: post.threadLink,
      author: post.author,
      creationDate: post.creationDate,
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
function loadThreadsFromFile() {
  const dataDir = path.join(process.cwd(), "data");
  let allThreads = new Map(); // Map을 사용하여 중복 방지

  const items = fs.readdirSync(dataDir);

  items.forEach((item) => {
    const itemPath = path.join(dataDir, item);

    if (fs.statSync(itemPath).isDirectory()) {
      const weekFolders = fs.readdirSync(itemPath);

      weekFolders.forEach((weekFolder) => {
        const weekPath = path.join(itemPath, weekFolder);
        const filesInWeekFolder = fs
          .readdirSync(weekPath)
          .filter((file) => file.endsWith(".json"))
          // top5Posts.json과 FormattedPosts.json 파일은 제외
          .filter(
            (file) =>
              !file.includes("top5Posts") && !file.includes("FormattedPosts")
          );

        filesInWeekFolder.forEach((fileName) => {
          const threadFile = path.join(weekPath, fileName);

          if (fs.existsSync(threadFile)) {
            try {
              const data = fs.readFileSync(threadFile, "utf-8");
              const threads = JSON.parse(data);
              // threadId를 키로 사용하여 중복 제거
              threads.forEach((thread) => {
                allThreads.set(thread.threadId, thread);
              });
            } catch (err) {
              console.error(`Error reading file: ${threadFile}`, err);
            }
          }
        });
      });
    }
  });

  return Array.from(allThreads.values()); // Map을 배열로 변환
}

// 메인 실행 코드
const threads = loadThreadsFromFile();
console.log(`총 ${threads.length}개의 고유한 스레드를 로드했습니다.`);
saveTop5PostsByChannelAndWeek(threads);
saveFormattedTop5Posts(threads);
