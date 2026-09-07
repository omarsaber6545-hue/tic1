import {
  Guild,
  GuildMember,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  Client
} from 'discord.js';
import prisma from '../database/prisma.js';
import { createEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export class GiveawayService {
  /**
   * Start a new giveaway
   */
  public static async createGiveaway(
    guild: Guild,
    channel: TextChannel,
    host: GuildMember,
    options: {
      prize: string;
      durationSeconds: number;
      winnersCount: number;
      requiredRoleId?: string;
      requiredPoints?: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    const endsAt = new Date(Date.now() + options.durationSeconds * 1000);
    const endTimestamp = Math.floor(endsAt.getTime() / 1000);

    const embed = createEmbed({
      title: `🎉 مسابقة جديدة: ${options.prize}`,
      description: `اضغط على الزر أدناه للدخول في السحب!\n\n` +
        `🏆 **عدد الفائزين:** ${options.winnersCount}\n` +
        `👤 **منظم المسابقة:** ${host.user}\n` +
        `⏰ **تنتهي:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)`,
      color: COLORS.PURPLE
    });

    if (options.requiredRoleId) {
      embed.addFields({
        name: '🛡️ الرتبة المطلوبة:',
        value: `<@&${options.requiredRoleId}>`,
        inline: true
      });
    }

    if (options.requiredPoints && options.requiredPoints > 0) {
      embed.addFields({
        name: '⭐ النقاط المطلوبة:',
        value: `${options.requiredPoints} نقطة`,
        inline: true
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter')
        .setLabel('دخول المسابقة (0)')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary)
    );

    const sentMessage = await channel.send({
      embeds: [embed],
      components: [row]
    });

    await prisma.giveaway.create({
      data: {
        guildId: guild.id,
        channelId: channel.id,
        messageId: sentMessage.id,
        prize: options.prize,
        winnersCount: options.winnersCount,
        requiredRoleId: options.requiredRoleId || null,
        requiredPoints: options.requiredPoints || 0,
        endsAt,
        hostId: host.id,
        participants: '[]',
        winners: '[]',
        ended: false
      }
    });

    return { success: true, message: `تم إطلاق المسابقة بنجاح في ${channel}!` };
  }

  /**
   * Handle member clicking the enter button
   */
  public static async handleEnter(interaction: ButtonInteraction): Promise<void> {
    const giveaway = await prisma.giveaway.findUnique({
      where: { messageId: interaction.message.id }
    });

    if (!giveaway) {
      await interaction.reply({
        content: 'لم يتم العثور على بيانات هذه المسابقة.',
        ephemeral: true
      });
      return;
    }

    if (giveaway.ended || new Date() >= giveaway.endsAt) {
      await interaction.reply({
        content: 'هذه المسابقة انتهت بالفعل!',
        ephemeral: true
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const userId = member.id;

    // Check Role Requirement
    if (giveaway.requiredRoleId) {
      if (!member.roles.cache.has(giveaway.requiredRoleId)) {
        await interaction.reply({
          content: `عذراً، يجب أن تمتلك رتبة <@&${giveaway.requiredRoleId}> للمشاركة في هذه المسابقة!`,
          ephemeral: true
        });
        return;
      }
    }

    // Check Points Requirement
    if (giveaway.requiredPoints > 0) {
      const memberData = await prisma.member.findUnique({
        where: {
          guildId_userId: {
            guildId: interaction.guildId!,
            userId
          }
        }
      });

      if (!memberData || memberData.points < giveaway.requiredPoints) {
        await interaction.reply({
          content: `عذراً، يجب أن تمتلك على الأقل **${giveaway.requiredPoints}** نقطة للمشاركة! (نقاطك الحالية: ${memberData?.points || 0})`,
          ephemeral: true
        });
        return;
      }
    }

    let participants: string[] = JSON.parse(giveaway.participants || '[]');

    if (participants.includes(userId)) {
      // Leave giveaway
      participants = participants.filter((id) => id !== userId);
      await prisma.giveaway.update({
        where: { messageId: interaction.message.id },
        data: { participants: JSON.stringify(participants) }
      });

      await interaction.reply({
        content: 'لقد قمت بإلغاء مشاركتك في المسابقة.',
        ephemeral: true
      });
    } else {
      // Enter giveaway
      participants.push(userId);
      await prisma.giveaway.update({
        where: { messageId: interaction.message.id },
        data: { participants: JSON.stringify(participants) }
      });

      await interaction.reply({
        content: '🎉 تم تسجيل دخولك في المسابقة بنجاح! حظاً موفقاً.',
        ephemeral: true
      });
    }

    // Update button participant count
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter')
        .setLabel(`دخول المسابقة (${participants.length})`)
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.message.edit({
      components: [row]
    }).catch(() => null);
  }

  /**
   * Automatic background scheduler to finish expired giveaways
   */
  public static startScheduler(client: Client): void {
    setInterval(async () => {
      try {
        const expiredGiveaways = await prisma.giveaway.findMany({
          where: {
            ended: false,
            endsAt: { lte: new Date() }
          }
        });

        for (const giveaway of expiredGiveaways) {
          await this.endGiveaway(client, giveaway.messageId);
        }
      } catch (err) {
        console.error('[GiveawayService] خطأ في مجدول المسابقات:', err);
      }
    }, 15000); // Check every 15s
  }

  /**
   * End giveaway and pick winners
   */
  public static async endGiveaway(
    client: Client,
    messageId: string
  ): Promise<{ success: boolean; winners?: string[]; message?: string }> {
    const giveaway = await prisma.giveaway.findUnique({
      where: { messageId }
    });

    if (!giveaway || giveaway.ended) {
      return { success: false, message: 'المسابقة غير موجودة أو منتهية بالفعل.' };
    }

    const participants: string[] = JSON.parse(giveaway.participants || '[]');
    let winners: string[] = [];

    if (participants.length > 0) {
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      winners = shuffled.slice(0, giveaway.winnersCount);
    }

    await prisma.giveaway.update({
      where: { messageId },
      data: {
        ended: true,
        winners: JSON.stringify(winners)
      }
    });

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel && channel instanceof TextChannel) {
      const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);

      if (winners.length > 0) {
        const winnerMentions = winners.map((id) => `<@${id}>`).join(' ، ');

        if (message) {
          const endedEmbed = createEmbed({
            title: `🎊 انتهت المسابقة: ${giveaway.prize}`,
            description: `🏆 الفائزون: ${winnerMentions}\n👤 منظم المسابقة: <@${giveaway.hostId}>\n👥 إجمالي المشاركين: ${participants.length}`,
            color: COLORS.SUCCESS
          });

          await message.edit({ embeds: [endedEmbed], components: [] });
        }

        await channel.send({
          content: `مبروك للفائزين بالمسابقة: ${winnerMentions} 🎉 لقد فزتم بـ **${giveaway.prize}**!`
        });
      } else {
        if (message) {
          const noWinnerEmbed = createEmbed({
            title: `🎊 انتهت المسابقة: ${giveaway.prize}`,
            description: 'للأسف، لم يشارك أحد في المسابقة ولذلك لا يوجد فائزون.',
            color: COLORS.DARK
          });

          await message.edit({ embeds: [noWinnerEmbed], components: [] });
        }
      }
    }

    return { success: true, winners };
  }

  /**
   * Reroll a giveaway winner
   */
  public static async rerollGiveaway(
    client: Client,
    messageId: string
  ): Promise<{ success: boolean; newWinner?: string; message?: string }> {
    const giveaway = await prisma.giveaway.findUnique({
      where: { messageId }
    });

    if (!giveaway) {
      return { success: false, message: 'المسابقة غير موجودة!' };
    }

    const participants: string[] = JSON.parse(giveaway.participants || '[]');
    const currentWinners: string[] = JSON.parse(giveaway.winners || '[]');

    const remainingParticipants = participants.filter((id) => !currentWinners.includes(id));

    if (remainingParticipants.length === 0) {
      return { success: false, message: 'لا يوجد مشاركون مؤهلون إضافيون لإعادة السحب!' };
    }

    const newWinner = remainingParticipants[Math.floor(Math.random() * remainingParticipants.length)];
    currentWinners.push(newWinner);

    await prisma.giveaway.update({
      where: { messageId },
      data: { winners: JSON.stringify(currentWinners) }
    });

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel && channel instanceof TextChannel) {
      await channel.send({
        content: `🎉 الفائز الجديد بعد إعادة السحب في مسابقة **${giveaway.prize}** هو: <@${newWinner}>! مبروك!`
      });
    }

    return { success: true, newWinner };
  }
}
