import { Client, REST, Routes } from 'discord.js';
import { commands } from '../commands/index.js';
import { GiveawayService } from '../services/giveawayService.js';
import prisma from '../database/prisma.js';

export async function onReady(client: Client): Promise<void> {
  console.log('====================================================');
  console.log(`🤖 تم تشغيل البوت بنجاح باسم: ${client.user?.tag}`);
  console.log(`🌐 عدد السيرفرات المتصلة: ${client.guilds.cache.size}`);
  console.log(`👥 إجمالي الأعضاء: ${client.users.cache.size}`);
  console.log('⚡ نظام الدعم والإدارة التلقائي باللغة العربية جاهز!');
  console.log('====================================================');

  client.user?.setActivity({
    name: 'سيرفرات ديسكورد العربية 🛡️ | /نقاط',
    type: 0 // Playing
  });

  // Ensure all guilds exist in the database
  for (const guild of client.guilds.cache.values()) {
    try {
      await prisma.guild.upsert({
        where: { id: guild.id },
        update: {
          name: guild.name,
          icon: guild.iconURL()
        },
        create: {
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL(),
          settings: {
            create: {}
          }
        }
      });
    } catch (err) {
      console.error(`[Ready] خطأ في تحديث بيانات السيرفر ${guild.name}:`, err);
    }
  }

  // Register Slash Commands with Discord API
  try {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID || client.user?.id;

    if (token && clientId) {
      const rest = new REST({ version: '10' }).setToken(token);
      const commandData = commands.map((c) => c.data.toJSON());

      console.log(`[Commands] جاري تسجيل ${commandData.length} أمراً باللغة العربية مع Discord API...`);

      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData
      });

      console.log('✅ تم تسجيل جميع الأوامر التفاعلية بنجاح على مستوى الديسكورد!');
    } else {
      console.warn('⚠️ لم يتم العثور على DISCORD_TOKEN أو CLIENT_ID في .env لتسجيل الأوامر.');
    }
  } catch (err) {
    console.error('❌ فشل تسجيل الأوامر:', err);
  }

  // Start Giveaway automatic background scheduler
  GiveawayService.startScheduler(client);
}
