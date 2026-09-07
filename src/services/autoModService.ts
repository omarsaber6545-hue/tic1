import { Message, PermissionFlagsBits } from 'discord.js';
import prisma from '../database/prisma.js';
import { LogService } from './logService.js';
import { ModerationService } from './moderationService.js';

interface SpamTracker {
  count: number;
  lastMessage: string;
  firstTimestamp: number;
}

const userMessageTrackers = new Map<string, SpamTracker>();

export class AutoModService {
  /**
   * Run AutoMod inspection on incoming message
   * Returns true if message was deleted or member was punished (should stop further processing)
   */
  public static async processMessage(message: Message): Promise<boolean> {
    if (!message.guild || message.author.bot) return false;
    if (!message.member) return false;

    // Bypass admins & moderators
    if (
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return false;
    }

    const settings = await prisma.guildSettings.findUnique({
      where: { guildId: message.guild.id }
    });

    if (!settings || !settings.autoModEnabled) return false;

    const content = message.content;
    const trackerKey = `${message.guild.id}_${message.author.id}`;
    const now = Date.now();

    // 1. Anti-Invite Check
    if (settings.antiInvite) {
      const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
      if (inviteRegex.test(content)) {
        await this.handleViolation(message, 'نشر روابط دعوة ديسكورد (Anti-Invite)', settings.autoModAction);
        return true;
      }
    }

    // 2. Anti-Links Check
    if (settings.antiLinks) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      if (urlRegex.test(content)) {
        await this.handleViolation(message, 'نشر روابط خارجية غير مصرح بها (Anti-Links)', settings.autoModAction);
        return true;
      }
    }

    // 3. Mention Spam Check
    if (settings.antiMentionSpam) {
      const mentionCount = message.mentions.users.size + message.mentions.roles.size;
      if (mentionCount >= settings.mentionThreshold) {
        await this.handleViolation(
          message,
          `منشن مكثف ومزعج (${mentionCount} منشن) (Mention Spam)`,
          settings.autoModAction
        );
        return true;
      }
    }

    // 4. Bad Words Filter
    if (settings.badWords) {
      try {
        const words: string[] = JSON.parse(settings.badWords);
        const lowerContent = content.toLowerCase();
        const hasBadWord = words.some((word) =>
          lowerContent.includes(word.trim().toLowerCase())
        );

        if (hasBadWord) {
          await this.handleViolation(message, 'استخدام كلمات ممنوعة ومخالفة', settings.autoModAction);
          return true;
        }
      } catch {
        // Bad words JSON parse ignored
      }
    }

    // 5. Anti-Flood (repeated characters)
    if (settings.antiFlood) {
      const floodRegex = /(.)\1{10,}/; // Same character repeated 11+ times
      if (floodRegex.test(content) || content.length > 1500) {
        await this.handleViolation(message, 'إرسال رسائل متكررة الحروف أو طويلة جداً (Anti-Flood)', 'DELETE');
        return true;
      }
    }

    // 6. Anti-Spam & Anti-Duplicate (Rate Limiting)
    if (settings.antiSpam || settings.antiDuplicate) {
      let tracker = userMessageTrackers.get(trackerKey);
      if (!tracker || now - tracker.firstTimestamp > 5000) {
        tracker = { count: 1, lastMessage: content, firstTimestamp: now };
        userMessageTrackers.set(trackerKey, tracker);
      } else {
        tracker.count++;

        // Duplicate check
        if (settings.antiDuplicate && tracker.lastMessage === content && tracker.count >= 3) {
          await this.handleViolation(message, 'تكرار نفس الرسالة عدة مرات (Anti-Duplicate)', 'DELETE');
          return true;
        }

        // Spam rate limit check
        if (settings.antiSpam && tracker.count >= settings.spamThreshold) {
          await this.handleViolation(
            message,
            `إرسال رسائل متتالية بسرعة فائقة (${tracker.count} رسائل/5 ثوانٍ) (Anti-Spam)`,
            settings.autoModAction
          );
          userMessageTrackers.delete(trackerKey);
          return true;
        }
      }
    }

    return false;
  }

  private static async handleViolation(
    message: Message,
    reason: string,
    action: string
  ): Promise<void> {
    const guild = message.guild!;
    const member = message.member!;

    // Always delete offending message
    await message.delete().catch(() => null);

    // Apply configured action
    try {
      if (action === 'WARN') {
        const botMember = guild.members.me;
        if (botMember) {
          await ModerationService.warnMember(guild, member, botMember, `[AutoMod]: ${reason}`);
        }
      } else if (action === 'TIMEOUT') {
        await member.timeout(10 * 60 * 1000, `[AutoMod]: ${reason}`);
        await LogService.logModerationAction(guild, {
          action: 'تايم أوت تلقائي (AutoMod)',
          moderatorTag: 'نظام الحماية التلقائي',
          targetTag: member.user.tag,
          targetId: member.id,
          reason,
          duration: '10 دقائق'
        });
      } else if (action === 'KICK') {
        await member.kick(`[AutoMod]: ${reason}`);
        await LogService.logModerationAction(guild, {
          action: 'طرد تلقائي (AutoMod)',
          moderatorTag: 'نظام الحماية التلقائي',
          targetTag: member.user.tag,
          targetId: member.id,
          reason
        });
      } else if (action === 'BAN') {
        await member.ban({ reason: `[AutoMod]: ${reason}` });
        await LogService.logModerationAction(guild, {
          action: 'حظر تلقائي (AutoMod)',
          moderatorTag: 'نظام الحماية التلقائي',
          targetTag: member.user.tag,
          targetId: member.id,
          reason
        });
      }

      // Notify in channel temporarily
      if ('send' in message.channel) {
        const warningMsg = await message.channel.send({
          content: `⚠️ ${member.user} تم التصدي لرسالتك بواسطة نظام الحماية التلقائي: **${reason}**`
        });
        setTimeout(() => warningMsg.delete().catch(() => null), 5000);
      }
    } catch (err) {
      console.error('[AutoModService] فشل تطبيق إجراء الحماية:', err);
    }
  }
}
