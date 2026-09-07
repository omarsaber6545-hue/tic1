import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType
} from 'discord.js';

import { onReady } from './events/ready.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { onMessageCreate } from './events/messageCreate.js';
import { onGuildMemberAdd } from './events/guildMemberAdd.js';
import { onGuildMemberRemove } from './events/guildMemberRemove.js';
import { onMessageDelete } from './events/messageDelete.js';
import { onMessageUpdate } from './events/messageUpdate.js';
import { onChannelCreate, onChannelDelete } from './events/channelEvents.js';
import { onGuildMemberUpdate } from './events/guildMemberUpdate.js';
import prisma from './database/prisma.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});

// Event Listeners
client.once('ready', () => onReady(client));
client.on('interactionCreate', onInteractionCreate);
client.on('messageCreate', onMessageCreate);
client.on('guildMemberAdd', onGuildMemberAdd);
client.on('guildMemberRemove', onGuildMemberRemove);
client.on('messageDelete', onMessageDelete);
client.on('messageUpdate', onMessageUpdate);
client.on('channelCreate', onChannelCreate);
client.on('channelDelete', onChannelDelete);
client.on('guildMemberUpdate', onGuildMemberUpdate);

// Process Error Handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection] خطأ غير معالج:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException] استثناء حرج:', error);
});

async function shutdown() {
  console.log('🛑 جاري إيقاف البوت وفصل الاتصال بأمان...');
  await client.destroy();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Launch Bot
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'your_bot_token_here') {
  console.log('⚠️ لم يتم وضع DISCORD_TOKEN في ملف .env بعد.');
  console.log('💡 قم بوضع توكن البوت في .env ثم شغل البوت بالأمر: npm run dev');
} else {
  client.login(token).catch((err) => {
    console.error('❌ تعذر تسجيل الدخول إلى Discord:', err.message);
  });
}

export { client };
