import { GuildMember, TextChannel } from 'discord.js';
import prisma from '../database/prisma.js';
import { createEmbed, formatNumber } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export class WelcomeService {
  /**
   * Handle when a new member joins the guild
   */
  public static async handleMemberJoin(member: GuildMember): Promise<void> {
    const guild = member.guild;
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId: guild.id }
    });

    if (!settings) return;

    // 1. Auto-Role assignment
    if (settings.autoRoleId) {
      try {
        const role = await guild.roles.fetch(settings.autoRoleId).catch(() => null);
        if (role) {
          await member.roles.add(role, 'الرتبة التلقائية للأعضاء الجدد');
        }
      } catch (err) {
        console.error('[WelcomeService] خطأ في تعيين الرتبة التلقائية:', err);
      }
    }

    // 2. Welcome Channel Message
    if (settings.welcomeEnabled && settings.welcomeChannelId) {
      try {
        const channel = await guild.channels
          .fetch(settings.welcomeChannelId)
          .catch(() => null);

        if (channel && channel instanceof TextChannel) {
          const rawMessage =
            settings.welcomeMessage ||
            'أهلاً بك {user} في سيرفر {server}! أنت العضو رقم {count} 🌟';

          const formattedMessage = rawMessage
            .replace(/{user}/g, member.user.toString())
            .replace(/{server}/g, guild.name)
            .replace(/{count}/g, formatNumber(guild.memberCount));

          const embed = createEmbed({
            title: `👋 مرحباً بك في ${guild.name}!`,
            description: formattedMessage,
            color: COLORS.PRIMARY
          })
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .addFields(
              { name: '👤 العضو:', value: member.user.username, inline: true },
              { name: '👥 عدد الأعضاء:', value: `${formatNumber(guild.memberCount)} عضو`, inline: true },
              { name: '📅 إنشاء الحساب:', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            );

          await channel.send({
            content: `${member.user}`,
            embeds: [embed]
          });
        }
      } catch (err) {
        console.error('[WelcomeService] خطأ في إرسال رسالة الترحيب:', err);
      }
    }

    // 3. Welcome Direct Message (DM)
    if (settings.welcomeDmEnabled && settings.welcomeDmMessage) {
      try {
        const dmText = settings.welcomeDmMessage
          .replace(/{user}/g, member.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{count}/g, formatNumber(guild.memberCount));

        await member.send({
          embeds: [
            createEmbed({
              title: `🎉 مرحباً بك في ${guild.name}!`,
              description: dmText,
              color: COLORS.PRIMARY
            })
          ]
        });
      } catch {
        // Ignored if user has DMs closed
      }
    }
  }
}
