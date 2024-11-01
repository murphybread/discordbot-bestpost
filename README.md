
디스코드의 쓰레드(포스트) 기반으로 해당 쓰레드에 추가된 서브 메시지와 이모지의 수를 측정하여 best 쓰레드를 선정하는 프로그램

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
