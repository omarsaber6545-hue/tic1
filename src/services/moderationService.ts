import { Guild, GuildMember, PermissionFlagsBits, TextChannel } from 'discord.js';
import prisma from '../database/prisma.js';
import { LogService } from './logService.js';
import { createEmbed, createErrorEmbed, createSuccessEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export class ModerationService {
  /**
   * Validate role hierarchy before any moderation action
   */
  public static canModerate(
    executor: GuildMember,
    target: GuildMember
  ): { allowed: boolean; reason?: string } {
    if (target.id === executor.id) {
      return { allowed: false, reason: 'لا يمكنك تنفيذ إجراء إداري على نفسك!' };
    }

    if (target.id === executor.guild.ownerId) {
      return { allowed: false, reason: 'لا يمكنك معاقبة مالك السيرفر!' };
    }

    // Role hierarchy check for executor
    if (
      executor.id !== executor.guild.ownerId &&
      target.roles.highest.position >= executor.roles.highest.position
    ) {
      return {
        allowed: false,
        reason: 'لا يمكنك معاقبة هذا العضو لأن رتبته أعلى من رتبتك أو مساوية لها!'
      };
    }

    // Role hierarchy check for bot itself
    const botMember = executor.guild.members.me;
    if (botMember && target.roles.highest.position >= botMember.roles.highest.position) {
      return {
        allowed: false,
        reason: 'لا يستطيع البوت معاقبة هذا العضو لأن رتبة العضو أعلى من رتبة البوت أو مساوية لها!'
      };
    }

    return { allowed: true };
  }

  /**
   * Add a warning to a member and trigger automatic escalation if configured
   */
  public static async warnMember(
    guild: Guild,
    target: GuildMember,
    moderator: GuildMember,
    reason: string
  ): Promise<{ warnCount: number; escalationAction?: string }> {
    // 1. Save warning
    await prisma.warning.create({
      data: {
        guildId: guild.id,
        userId: target.id,
        moderatorId: moderator.id,
        reason
      }
    });

    // 2. Count active warnings
    const count = await prisma.warning.count({
      where: {
        guildId: guild.id,
        userId: target.id
      }
    });

    // 3. Log warning
    await LogService.logModerationAction(guild, {
      action: `تحذير (التحذير رقم ${count})`,
      moderatorTag: moderator.user.tag,
      targetTag: target.user.tag,
      targetId: target.id,
      reason
    });

    // 4. Check auto-escalation from settings
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId: guild.id }
    });

    let escalationAction: string | undefined;

    if (settings) {
      if (count >= 7 && settings.warnEscalation7) {
        escalationAction = settings.warnEscalation7;
      } else if (count >= 5 && settings.warnEscalation5) {
        escalationAction = settings.warnEscalation5;
      } else if (count >= 3 && settings.warnEscalation3) {
        escalationAction = settings.warnEscalation3;
      }

      if (escalationAction) {
        await this.applyEscalation(guild, target, escalationAction, count);
      }
    }

    return { warnCount: count, escalationAction };
  }

  private static async applyEscalation(
    guild: Guild,
    target: GuildMember,
    action: string,
    warnCount: number
  ): Promise<void> {
    const reason = `نظام التصعيد التلقائي: تجاوز ${warnCount} تحذيرات`;

    try {
      if (action === 'TIMEOUT') {
        // 1 hour timeout
        await target.timeout(60 * 60 * 1000, reason);
        await LogService.logModerationAction(guild, {
          action: 'تايم أوت تلقائي (تصعيد)',
          moderatorTag: 'النظام التلقائي (AutoMod)',
          targetTag: target.user.tag,
          targetId: target.id,
          reason,
          duration: 'ساعة واحدة'
        });
      } else if (action === 'KICK') {
        await target.kick(reason);
        await LogService.logModerationAction(guild, {
          action: 'طرد تلقائي (تصعيد)',
          moderatorTag: 'النظام التلقائي (AutoMod)',
          targetTag: target.user.tag,
          targetId: target.id,
          reason
        });
      } else if (action === 'BAN') {
        await target.ban({ reason });
        await LogService.logModerationAction(guild, {
          action: 'حظر تلقائي (تصعيد)',
          moderatorTag: 'النظام التلقائي (AutoMod)',
          targetTag: target.user.tag,
          targetId: target.id,
          reason
        });
      }
    } catch (err) {
      console.error(`[ModerationService] فشل تطبيق عقوبة التصعيد ${action}:`, err);
    }
  }

  /**
   * Get warnings for a member
   */
  public static async getWarnings(guildId: string, userId: string) {
    return prisma.warning.findMany({
      where: { guildId, userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Remove a specific warning by ID
   */
  public static async removeWarning(guildId: string, warnId: number): Promise<boolean> {
    const warn = await prisma.warning.findFirst({
      where: { id: warnId, guildId }
    });
    if (!warn) return false;

    await prisma.warning.delete({
      where: { id: warnId }
    });
    return true;
  }

  /**
   * Clear all warnings for a member
   */
  public static async clearWarnings(guildId: string, userId: string): Promise<number> {
    const result = await prisma.warning.deleteMany({
      where: { guildId, userId }
    });
    return result.count;
  }
}
