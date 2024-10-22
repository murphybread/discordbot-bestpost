require('dotenv').config();

// Import discord.js
const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN);

// Ready Event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});