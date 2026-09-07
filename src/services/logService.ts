import { Guild, TextChannel, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import prisma from '../database/prisma.js';
import { createEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export class LogService {
  /**
   * Log an event to the appropriate channel configured for the guild
   */
  public static async logEvent(
    guild: Guild,
    logType: 'logModeration' | 'logJoinLeave' | 'logMessages' | 'logTickets' | 'logRoles' | 'logChannels' | 'logServer',
    embed: EmbedBuilder,
    attachment?: AttachmentBuilder
  ): Promise<void> {
    try {
      const settings = await prisma.guildSettings.findUnique({
        where: { guildId: guild.id }
      });

      if (!settings) return;

      const targetChannelId = (settings[logType] as string | null) || settings.logChannelId;
      if (!targetChannelId) return;

      const channel = await guild.channels.fetch(targetChannelId).catch(() => null);
      if (!channel || !(channel instanceof TextChannel)) return;

      await channel.send({
        embeds: [embed],
        files: attachment ? [attachment] : []
      });
    } catch (err) {
      console.error(`[LogService] خطأ في تسجيل الحدث ${logType}:`, err);
    }
  }

  public static async logModerationAction(
    guild: Guild,
    options: {
      action: string;
      moderatorTag: string;
      targetTag: string;
      targetId: string;
      reason: string;
      duration?: string;
    }
  ): Promise<void> {
    const embed = createEmbed({
      title: `🛡️ إجراء إداري: ${options.action}`,
      color: COLORS.DANGER,
      timestamp: true
    }).addFields(
      { name: '👤 العضو المستهدف:', value: `${options.targetTag} (\`${options.targetId}\`)`, inline: true },
      { name: '👮 المشرف المنفذ:', value: options.moderatorTag, inline: true },
      { name: '📄 السبب:', value: options.reason || 'لا يوجد سبب محدد', inline: false }
    );

    if (options.duration) {
      embed.addFields({ name: '⏱️ المدة:', value: options.duration, inline: true });
    }

    await this.logEvent(guild, 'logModeration', embed);

    // Also persist in audit logs
    await prisma.auditLog.create({
      data: {
        guildId: guild.id,
        action: options.action,
        executorId: options.moderatorTag,
        targetId: options.targetId,
        details: options.reason
      }
    }).catch(() => null);
  }

  public static async logTicketAction(
    guild: Guild,
    options: {
      action: 'إنشاء تذكرة' | 'استلام تذكرة' | 'إغلاق تذكرة';
      ticketNumber: number;
      category: string;
      userTag: string;
      claimedByTag?: string;
      closedByTag?: string;
      transcriptAttachment?: AttachmentBuilder;
    }
  ): Promise<void> {
    let color = COLORS.INFO;
    if (options.action === 'استلام تذكرة') color = COLORS.WARNING;
    if (options.action === 'إغلاق تذكرة') color = COLORS.SUCCESS;

    const embed = createEmbed({
      title: `🎫 سجل التذاكر: ${options.action} #${options.ticketNumber}`,
      color,
      timestamp: true
    }).addFields(
      { name: '🏷️ القسم:', value: options.category, inline: true },
      { name: '👤 صاحب التذكرة:', value: options.userTag, inline: true }
    );

    if (options.claimedByTag) {
      embed.addFields({ name: '📌 الموظف المستلم:', value: options.claimedByTag, inline: true });
    }
    if (options.closedByTag) {
      embed.addFields({ name: '🔒 أغلقت بواسطة:', value: options.closedByTag, inline: true });
    }

    await this.logEvent(guild, 'logTickets', embed, options.transcriptAttachment);
  }
}
