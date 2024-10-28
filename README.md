
디스코드의 쓰레드(포스트) 기반으로 해당 쓰레드에 추가된 서브 메시지와 이모지의 수를 측정하여 best 쓰레드를 선정하는 프로그램

discord scope
- bot
- applications.commands


discord bot권한
- General Permissions
    - View Channels
- Text Permissions
    - Send Messages
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
