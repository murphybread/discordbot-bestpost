

g


discord scope
- bot
- applications.commands


discord bot권한
- General Permissions
    - View Channels
    - view Server Insight
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
