디스코드의 쓰레드(포스트) 기반으로 해당 쓰레드에 추가된 서브 메시지와 이모지의 수를 측정하여 best 쓰레드를 선정하는 프로그램

# 구현 목적

디스코드의 쓰레드(포스트) 기반으로 해당 쓰레드에 추가된 서브 메시지와 이모지의 수를 측정하여 best 쓰레드를 선정하는 프로그램입니다
우아한테크코스 프리코스 커뮤니티의 경우 열정이 많은 다양한 사람들이 정보를 주고받는 만큼 그 정보가 다른사람에게 잘전파되면 좋겠다 생각하였고 이를 디스코드 추천봇형태로 만들면 어떨까 생각하게 됐습니다. 그렇다면 글을 쓰는 사람들 입장에서 더 힘이나고, 찾아보기 어려웠던 사람들이 좋은 데이터를 얻게 되면서 쓰는 사람, 읽는 사람 모두에게 도움이 될거라 생각했기 때문입니다.

### 주요 명령어

- `이번주추천`(weeklyRecommend): 채널,몇 주차를 입력으로 받아 해당 채널의 해당 주차 인기 게시글 5개개를 보여줌(단 getmetadata 수행 필요)
- `프리코스7기_열정통계`(archievecommand): 프리코스 7기동안 생성된 주요 3개의 채널들의 총 메시지 수와 이모지 수 출력
- `프리코스7기_열정게시물`(프리코스7기\_열정게시물): 프리코스 7기동안 생성된 게시물들 중 메시지수와 이모지수가 가장 많이 달린 5개의 게시글 추천천

설치 방법
소스 다운로드
`gie clone https://github.com/murphybread/discordbot-bestpost.git`

필요한 라이브러리 다운
`npm install`

시크릿 설정

.env

```
DISCORD_TOKEN=<BOT TOKEN>
CHANNEL_ID_1=<19digit numbers>
CHANNEL_ID_2=<19digit numbers>
CHANNEL_ID_3=<19digit numbers>
USER_ID=<18digit numbers>
CLIENT_ID=<19digit numbers>
GUILD_ID=<19digit numbers>
```

최소 해당 기능을 가진 디스코드 봇이 채널에 오프라인상태로 존재
discord scope
-    [✓] bot
-    [✓] applications.commands

discord bot권한
-     [✓] Send Messages
-     [✓] Embed Links
-     [✓] Read Messages/View Channels
-     [✓] Use Slash Commands

# 실행 방법

기본적으로 수집을원하는 서버와 채널들에 오프라인 상태로 해당 봇이 존재해야함

1. `node main.js`를 통해 디스코드 봇을 로그인합니다.
2. `node getmetadata.js`를 통해 각 채널의 정보들을 저장합니다. 처음 하는 경우에는 모든 데이터가 잘 저장되는지 터미널 화면을 확인해주세요.
3. `node comparemetadata.js`명령어를 통해 주간 besst5포스트를 위한 데이터를 따로 생성합니다. 생성 성공시 다음과 같이 2개의 파일이 각 주차별 디렉터리에 생성됩니다
4. 해당 채널에서 슬래쉬(`/`)를 입력후 필수 옵션인 채널이름과 주차를 선택하여 명령을 수행합니다.

`명령어 입력`
![](https://i.imgur.com/r3cpOkh.png)

#### 오늘의 추천 결과

![](https://i.imgur.com/W7OCtUB.png)

#### 이번주 추천 결과

![](https://i.imgur.com/Bg85nm4.png)

#### 프리코스7기\_열정통계

![](https://i.imgur.com/rrvyXI6.png)

#### 프리코스7기\_열정게시물

![](https://i.imgur.com/pCSqfqo.png)

### 명령어 업데이트 방법

- `node deploy-command.js`를 통해 `commands`에 있는 명령어 등록 가능능

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
- 각 주 마다 데아터를 ./data/channel\_채널이름/week0/week0-채널이름.json 같은 형태로 저장

best5 쓰레드 포맷팅
`comparemetadata.js` : 각 주의 데이터중에서 총 리액션 + 총 서브메시지수 합 5개를 따로 저장 이후 이번주추천에서 사용

- 각 주차별 아래에 ./data/channel\_채널이름/week0/week0-top5Posts.json 같은 형태로 상위 5개의 포스트 정보 저장
- 해당 파일에서 원하는 부분만 봇이 보여주기위해 포맷팅 파일 ./data/channel\_채널이름/week0/week0-top5FormattedPosts.json 저장
  포맷팅된 파일은 출력용 다음의 정보만 저장

```
            threadName: post.threadName,
            totalReactions: post.totalReactions,
            messageCount: post.messageCount,
            threadLink: post.threadLink,
            author: post.author,
            creationDate: post.creationDate
```

#### 기능 history

- 디스코드 봇 프리코스 서버 채널에 로그인 ✅
- fetchdata 저장 시 빈배열 반환 ✅
- weeknumber 기준 변경 ✅
- 메시지 오류시 mock데이터 작성 ✅
  - 모든 데이터 안 불러와짐 ✅
- 시간대 기준 확인하기. (기본값 UTC 추정, KST로 통일하기) ✅
- daily 데이터 수집 프로세스 ❌ (기존 주간 데이터 사용)
- data 추출해서 이번주 게시물로 저장하기 ✅
- week데이터에서 best게시물 top5 선정하기 ✅
  - best 5게시물 보기좋게 이름, 총 리액션, 메시지 수 링크 정리 ✅
- 봇커맨드 입력에 따라 오늘 괜찮은 게시물 추천받기 ✅
- 토론하기 이외에 여러채널 데이터 저장하기 ✅
- best게시물까지 저장하기 ✅
- Breadking Point 증가량 비교 로직 📝
- 매일 업데이트되는 금일의 추천 best command 만들기 ✅
- 클라우드 기반 24시간 호스팅 시스템 ✅
- 이번주 Best 답변왕 찾기 (동일한 로직 적용: 메시지수+이모지 수 합계) 📝
- (7기프리코스\_열정통계)이번 기수동안 대표 채널 3개 (토론하기, 함께 나누기, 다시-돌아보기) 과 해당 채널들 총 게시글 ,메시지, 이모지 수 ✅
- (프리코스7기\_열정게시물) 이번 기수 7기에 생성된 채널3개에 대하여 메시지수+이모지가 가장많은 게시물 보여주기 ✅
