
디스코드의 쓰레드(포스트) 기반으로 해당 쓰레드에 추가된 서브 메시지와 이모지의 수를 측정하여 best 쓰레드를 선정하는 프로그램

프로그램 구조
├── README.md
├── channels
│   ├── channel_📚│함께-나누기
│   ├── channel_📝│토론하기
│   └── channel_🔸│다시-돌아보기
├── commands
│   ├── dailyrecommend.js
│   └── weeklyRecommend.js
├── comparemetadata.js
├── data
│   └── currentThreadData.json
├── deploy-commands.js
├── getmetadata.js
├── main.js
├── package-lock.json
├── package.json
├── savemetadata.js
└── temp

디스코드 봇 기능 수행
`main.js`: 디스코드 봇 로그인
`deploy-commands.js`: commands 아래의 파일들에 대해 커맨드 등록
`commands 디렉토리`: 각 커맨드 등록 파일

파일 수집
`getmetadata.js`: 입려된 채널ID를 바탕으로 각 채널의 쓰레드를 수집하고 해당 쓰레드의 정보 수집 

수집항목
```
        channelId: thread.parentId,
        channelName: thread.parent.name,
        threadId: thread.id,
        threadName: thread.name,
        threadLink: `https://discord.com/channels/${thread.guild.id}/${thread.id}`,
        creationDate: threadCreatedAtKST,
        weekNumber,
        mainPostReactions,
        totalReactions,
        messageCount: messages.size,
        author: authorName,
```

파일 저장
`savemetadata.js`: 쓰레드 정보를 파일로 저장. 여러 저장 메소드 사용

- 10개의 쓰레드 단위 배치로 .temp/ 에 저장 
- 한 채널의 모든 쓰레드 정보를 .channels/채널이름에 저장
- 모든 쓰레드의 정보를 ./data/currentThreadData.json으로 저장
- 각 주 마다 데아터를 ./data/channel_채널이름/week0/week0-채널이름.json 같은 형태로 저장

best5 쓰레드 포맷팅
`comparemetadata.js` : 각 주의 데이터중에서 총 리액션 + 총 서브메시지수 합 5개를 따로 저장 이후 이번주추천에서 사용

- 각 주차별 아래에 ./data/channel_채널이름/week0/week0-top5Posts.json 같은 형태로 상위 5개의 포스트 정보 저장
- 해당 파일에서 원하는 부분만 봇이 보여주기위해 포맷팅 파일 ./data/channel_채널이름/week0/week0-top5FormattedPosts.json 저장
포맷팅된 파일은 출력용 다음의 정보만 저장
```
            threadName: post.threadName,
            totalReactions: post.totalReactions,
            messageCount: post.messageCount,
            threadLink: post.threadLink,
            author: post.author,
            creationDate: post.creationDate
```



필요한 파일
.env
```
DISCORD_TOKEN
CHANNEL_ID_1
CHANNEL_ID_2
CHANNEL_ID_3
USER_ID

```

- 디스코드 봇 프리코스 서버 채널에 로그인 ✅
- fetchdata 저장 시 빈배열 반환  ✅
- weeknumber 기준 변경    ✅
- 메시지 오류시 mock데이터 작성 ✅
    - 모든 데이터 안 불러와짐 ✅
- 시간대 기준 확인하기. (기본값 UTC 추정, KST로 통일하기) ✅
- daily  데이터 수집 프로세스 ❌ (기존 주간 데이터 사용)
- data 추출해서 이번주 게시물로 저장하기 ✅
- week데이터에서 best게시물 top5 선정하기 ✅
    - best 5게시물 보기좋게 이름, 총 리액션, 메시지 수 링크 정리 ✅
- 봇커맨드 입력에 따라 오늘 괜찮은 게시물 추천받기 ✅
- 토론하기 이외에 여러채널 데이터 저장하기 ✅
- best게시물까지 저장하기 ✅
- Breadking Point 증가량 비교 로직 📝
- 매일 업데이트되는 금일의 추천 best command 만들기 ✅
- 클라우드 기반 24시간 호스팅 시스템 ✅

discord scope
    [✓] bot
    [✓] applications.commands


discord bot권한
     [✓] Send Messages
     [✓] Embed Links
     [✓] Read Messages/View Channels
     [✓] Use Slash Commands
