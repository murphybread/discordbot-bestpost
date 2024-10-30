require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 클라이언트 설정
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

// 커맨드 컬렉션 설정
client.commands = new Collection();

// commands 폴더에서 커맨드 파일들 로드
const commandsPath = path.join(__dirname, 'commands');
console.log('Commands 폴더 경로:', commandsPath); // 디버깅

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log('발견된 커맨드 파일들:', commandFiles); // 디버깅

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    console.log(`로딩된 커맨드:`, command.data.name); // 디버깅
    client.commands.set(command.data.name, command);
}

// 봇이 준비되었을 때
client.once('ready', () => {
    console.log(`봇이 준비되었습니다! 로그인: ${client.user.tag}`);
    console.log('등록된 커맨드들:', Array.from(client.commands.keys())); // 디버깅
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('Discord 클라이언트 로그인 완료');
    })
    .catch(console.error);

// 커맨드 처리
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    console.log('받은 커맨드:', interaction.commandName); // 디버깅
    console.log('등록된 커맨드들:', Array.from(client.commands.keys())); // 디버깅

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.log('Command not found:', interaction.commandName);
        return;
    }

    try {
        console.log('Executing command:', interaction.commandName); // 디버깅용
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '커맨드 실행 중 오류가 발생했습니다!',
                ephemeral: true
            }).catch(console.error);
        }
    }
});
