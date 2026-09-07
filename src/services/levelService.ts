import { Guild, GuildMember, TextChannel } from 'discord.js';
import prisma from '../database/prisma.js';
import { createEmbed } from '../utils/arabic.js';
import { createRankCardAttachment, RankCardData } from '../utils/card.js';
import { COLORS } from '../config/constants.js';

export class LevelService {
  /**
   * Calculate required XP to advance from current level to the next
   */
  public static getRequiredXp(level: number): number {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
  }

  /**
   * Handle member chat activity and award XP and Points with cooldown
   */
  public static async handleMessageActivity(
    guild: Guild,
    member: GuildMember,
    channel: TextChannel
  ): Promise<void> {
    if (member.user.bot) return;

    // Get guild settings
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId: guild.id }
    });

    if (!settings || (!settings.pointsEnabled && !settings.xpEnabled)) return;

    // Fetch or create member record
    const memberData = await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: guild.id,
          userId: member.id
        }
      },
      update: {},
      create: {
        guildId: guild.id,
        userId: member.id,
        level: 1,
        xp: 0,
        points: 0
      }
    });

    // Check XP cooldown
    const now = new Date();
    const cooldownMs = (settings.xpCooldown || 60) * 1000;
    if (memberData.lastMessageXp) {
      const elapsed = now.getTime() - new Date(memberData.lastMessageXp).getTime();
      if (elapsed < cooldownMs) {
        return; // Still on cooldown
      }
    }

    const xpEarned = settings.xpEnabled ? settings.xpRate : 0;
    const pointsEarned = settings.pointsEnabled ? settings.pointsPerMsg : 0;

    let newXp = memberData.xp + xpEarned;
    let newLevel = memberData.level;
    let requiredXp = this.getRequiredXp(newLevel);
    let leveledUp = false;

    // Check level up (can level up multiple times if huge XP gained)
    while (newXp >= requiredXp) {
      newXp -= requiredXp;
      newLevel++;
      requiredXp = this.getRequiredXp(newLevel);
      leveledUp = true;
    }

    // Update in database
    await prisma.member.update({
      where: {
        guildId_userId: {
          guildId: guild.id,
          userId: member.id
        }
      },
      data: {
        xp: newXp,
        level: newLevel,
        points: { increment: pointsEarned },
        lastMessageXp: now
      }
    });

    // Level-up notification
    if (leveledUp) {
      const template =
        settings.levelUpMessage ||
        'مبروك يا {user}! لقد ارتقيت إلى المستوى {level} 🎉✨';
      const messageContent = template
        .replace(/{user}/g, member.user.toString())
        .replace(/{level}/g, newLevel.toString())
        .replace(/{server}/g, guild.name);

      const levelUpEmbed = createEmbed({
        title: '🎉 ارتقاء في المستوى!',
        description: messageContent,
        color: COLORS.SUCCESS
      });

      let targetChannel: TextChannel = channel;
      if (settings.levelUpChannelId) {
        const designated = await guild.channels
          .fetch(settings.levelUpChannelId)
          .catch(() => null);
        if (designated && designated instanceof TextChannel) {
          targetChannel = designated;
        }
      }

      await targetChannel.send({ embeds: [levelUpEmbed] }).catch(() => null);
    }
  }

  /**
   * Get member rank card data and attachment
   */
  public static async getRankCard(
    guild: Guild,
    member: GuildMember
  ): Promise<{ data: RankCardData; attachment: ReturnType<typeof createRankCardAttachment> }> {
    const memberData = await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: guild.id,
          userId: member.id
        }
      },
      update: {},
      create: {
        guildId: guild.id,
        userId: member.id,
        level: 1,
        xp: 0,
        points: 0
      }
    });

    // Compute rank position
    const higherMembersCount = await prisma.member.count({
      where: {
        guildId: guild.id,
        OR: [
          { level: { gt: memberData.level } },
          { level: memberData.level, xp: { gt: memberData.xp } }
        ]
      }
    });

    const rank = higherMembersCount + 1;
    const requiredXp = this.getRequiredXp(memberData.level);

    const cardData: RankCardData = {
      username: member.user.username,
      avatarUrl: member.user.displayAvatarURL({ size: 128, extension: 'png' }),
      level: memberData.level,
      currentXp: memberData.xp,
      requiredXp,
      points: memberData.points,
      rank
    };

    const attachment = createRankCardAttachment(cardData);
    return { data: cardData, attachment };
  }

  /**
   * Daily points reward
   */
  public static async claimDaily(
    guildId: string,
    userId: string
  ): Promise<{ success: boolean; amount?: number; nextClaimSeconds?: number }> {
    const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
    const dailyReward = settings?.dailyReward || 100;

    const member = await prisma.member.upsert({
      where: { guildId_userId: { guildId, userId } },
      update: {},
      create: { guildId, userId }
    });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (member.lastDaily) {
      const elapsed = now.getTime() - new Date(member.lastDaily).getTime();
      if (elapsed < oneDayMs) {
        const remainingSeconds = Math.ceil((oneDayMs - elapsed) / 1000);
        return { success: false, nextClaimSeconds: remainingSeconds };
      }
    }

    await prisma.member.update({
      where: { guildId_userId: { guildId, userId } },
      data: {
        points: { increment: dailyReward },
        balance: { increment: dailyReward },
        lastDaily: now
      }
    });

    return { success: true, amount: dailyReward };
  }

  /**
   * Weekly points reward
   */
  public static async claimWeekly(
    guildId: string,
    userId: string
  ): Promise<{ success: boolean; amount?: number; nextClaimSeconds?: number }> {
    const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
    const weeklyReward = settings?.weeklyReward || 500;

    const member = await prisma.member.upsert({
      where: { guildId_userId: { guildId, userId } },
      update: {},
      create: { guildId, userId }
    });

    const now = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    if (member.lastWeekly) {
      const elapsed = now.getTime() - new Date(member.lastWeekly).getTime();
      if (elapsed < oneWeekMs) {
        const remainingSeconds = Math.ceil((oneWeekMs - elapsed) / 1000);
        return { success: false, nextClaimSeconds: remainingSeconds };
      }
    }

    await prisma.member.update({
      where: { guildId_userId: { guildId, userId } },
      data: {
        points: { increment: weeklyReward },
        balance: { increment: weeklyReward },
        lastWeekly: now
      }
    });

    return { success: true, amount: weeklyReward };
  }

  /**
   * Get leaderboard sorted by points or level
   */
  public static async getLeaderboard(
    guildId: string,
    type: 'points' | 'level' = 'level',
    limit: number = 10
  ) {
    if (type === 'points') {
      return prisma.member.findMany({
        where: { guildId },
        orderBy: [{ points: 'desc' }],
        take: limit
      });
    }

    return prisma.member.findMany({
      where: { guildId },
      orderBy: [{ level: 'desc' }, { xp: 'desc' }],
      take: limit
    });
  }
}
