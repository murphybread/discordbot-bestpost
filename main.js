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
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);


    // Replace 'YOUR_CHANNEL_ID' with the ID of the channel you want to track
    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        console.log(`Channel ID: ${channel.id}`);
        console.log(`Channel Name: ${channel.name}`);
        console.log(`Channel Type: ${channel.type}`);

        if (channel.isTextBased()) {
            console.log(`Successfully fetched channel: ${channel.name}`);

        } else {
            console.log('Channel is not text-based. Cannot track messages.');
            return;
        }

        // Fetch recent messages from the channel
        channel.messages.fetch({ limit: 100 }).then(messages => {
            console.log(`Successfully fetched ${messages.size} messages.`);

            messages.forEach(message => {
                console.log(`Message: ${message.content}, Author: ${message.author.username}`);
            });

        }).catch(error => {
            console.log('Failed to fetch messages:', error.message);
        });
    } catch (error) {
        console.log('Failed to fetch channel:', error.message);
    }
});