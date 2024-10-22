

기능
- 서버의 특정 채널의 메시지의 정보를 읽습니다
    - 해당 메시지의 이모지와 쓰레드 개수를 확인합니다
        - 매주 변화량을 기준으로 합니다.


discord scope
- bot
- applications.commands


discord bot권한
- General Permissions
    - View Channels
- Text Permissions
    - Send Messages
    - Manage Messages
    - Manage Threads
    - Embed Links
    - Read Message History
    - Add Reactions


# Architecture 
+--------------------+               +---------------+               +--------------+
| Your Code (Bot App)| ---> Login --->| Discord API   | ---> Events --->| Bot in Servers|
+--------------------+               +---------------+               +--------------+
        |                                |                                 |
        |                                V                                 |
        +---> Client Instance        Listens for Intents              Executes Commands
        |     with Intents                                               in Servers
        |
    Environment Config
    (.env, dotenv)
