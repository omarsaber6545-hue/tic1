import {
  Guild,
  GuildMember,
  TextChannel,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} from 'discord.js';
import prisma from '../database/prisma.js';
import { LogService } from './logService.js';
import { generateHtmlTranscript } from '../utils/transcript.js';
import { createEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/arabic.js';
import { COLORS, TICKET_CATEGORIES } from '../config/constants.js';

export class TicketService {
  /**
   * Create a new ticket channel for a member
   */
  public static async createTicket(
    guild: Guild,
    member: GuildMember,
    categoryKey: string
  ): Promise<{ success: boolean; channel?: TextChannel; message?: string }> {
    const categoryInfo = TICKET_CATEGORIES.find((c) => c.id === categoryKey) || {
      id: 'OTHER',
      label: 'استفسار عام',
      emoji: '❓'
    };

    // Check if tickets are enabled
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId: guild.id }
    });

    if (settings && !settings.ticketsEnabled) {
      return { success: false, message: 'نظام التذاكر معطل حالياً في هذا السيرفر.' };
    }

    // Check if user already has an open ticket
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        guildId: guild.id,
        creatorId: member.id,
        status: { in: ['OPEN', 'CLAIMED'] }
      }
    });

    if (existingTicket) {
      return {
        success: false,
        message: `لديك تذكرة مفتوحة بالفعل في الروم <#${existingTicket.channelId}>!`
      };
    }

    // Increment ticket counter
    const updatedSettings = await prisma.guildSettings.upsert({
      where: { guildId: guild.id },
      update: { ticketCount: { increment: 1 } },
      create: {
        guildId: guild.id,
        ticketCount: 1
      }
    });

    const ticketNumber = updatedSettings.ticketCount;
    const channelName = `ticket-${ticketNumber}`;

    // Build permission overwrites
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      },
      {
        id: guild.members.me?.id || '',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    if (settings?.supportRoleId) {
      permissionOverwrites.push({
        id: settings.supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }

    // Create channel
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: settings?.ticketCategoryId || undefined,
      permissionOverwrites
    });

    // Save ticket in database
    await prisma.ticket.create({
      data: {
        ticketNumber,
        guildId: guild.id,
        channelId: channel.id,
        creatorId: member.id,
        category: categoryInfo.label,
        status: 'OPEN'
      }
    });

    // Send welcome message in ticket
    const embed = createEmbed({
      title: `🎫 تذكرة رقم #${ticketNumber} • ${categoryInfo.label}`,
      description:
        settings?.ticketMessage ||
        'مرحباً بك في تذكرتك الخاصة. يرجى وصف طلبك بالتفصيل وسيقوم فريق الدعم بالرد عليك قريباً.',
      color: COLORS.PRIMARY
    }).addFields(
      { name: '👤 صاحب التذكرة:', value: `${member.user} (\`${member.id}\`)`, inline: true },
      { name: '🏷️ نوع التذكرة:', value: `${categoryInfo.emoji} ${categoryInfo.label}`, inline: true },
      { name: '⏰ وقت الإنشاء:', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
    );

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${channel.id}`)
        .setLabel('استلام التذكرة')
        .setEmoji('📌')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${channel.id}`)
        .setLabel('إغلاق التذكرة')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ticket_transcript_${channel.id}`)
        .setLabel('إنشاء Transcript')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_rename_${channel.id}`)
        .setLabel('تغيير الاسم')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_adduser_${channel.id}`)
        .setLabel('إضافة عضو')
        .setEmoji('➕')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ticket_removeuser_${channel.id}`)
        .setLabel('إزالة عضو')
        .setEmoji('➖')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({
      content: `${member.user} مرحباً بك! فريق الدعم سيكون معك في أقرب وقت.`,
      embeds: [embed],
      components: [row1, row2]
    });

    // Log creation
    await LogService.logTicketAction(guild, {
      action: 'إنشاء تذكرة',
      ticketNumber,
      category: categoryInfo.label,
      userTag: member.user.tag
    });

    return { success: true, channel };
  }

  /**
   * Claim ticket by staff member
   */
  public static async claimTicket(
    channel: TextChannel,
    staffMember: GuildMember
  ): Promise<{ success: boolean; message: string }> {
    const ticket = await prisma.ticket.findUnique({
      where: { channelId: channel.id }
    });

    if (!ticket) {
      return { success: false, message: 'لم يتم العثور على بيانات هذه التذكرة في قاعدة البيانات.' };
    }

    if (ticket.status === 'CLAIMED' && ticket.claimedById) {
      return {
        success: false,
        message: `هذه التذكرة مستلمة بالفعل بواسطة <@${ticket.claimedById}>!`
      };
    }

    await prisma.ticket.update({
      where: { channelId: channel.id },
      data: {
        status: 'CLAIMED',
        claimedById: staffMember.id
      }
    });

    const embed = createEmbed({
      title: '📌 تم استلام التذكرة',
      description: `تم استلام هذه التذكرة بواسطة المشرف: ${staffMember.user}`,
      color: COLORS.WARNING
    });

    await channel.send({ embeds: [embed] });

    await LogService.logTicketAction(channel.guild, {
      action: 'استلام تذكرة',
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      userTag: `<@${ticket.creatorId}>`,
      claimedByTag: staffMember.user.tag
    });

    return { success: true, message: `تم استلام التذكرة بنجاح بواسطة ${staffMember.user.username}!` };
  }

  /**
   * Close ticket and generate transcript
   */
  public static async closeTicket(
    channel: TextChannel,
    closedBy: GuildMember
  ): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { channelId: channel.id }
    });

    if (!ticket) {
      await channel.send({
        embeds: [createErrorEmbed('خطأ', 'لم يتم العثور على بيانات التذكرة!')]
      });
      return;
    }

    // Fetch creator user
    const creatorUser = await channel.client.users.fetch(ticket.creatorId).catch(() => null);

    // Generate Transcript
    const htmlTranscript = await generateHtmlTranscript(channel, {
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      creatorTag: creatorUser ? creatorUser.tag : ticket.creatorId,
      closedByTag: closedBy.user.tag
    });

    const transcriptBuffer = Buffer.from(htmlTranscript, 'utf-8');
    const attachment = new AttachmentBuilder(transcriptBuffer, {
      name: `transcript-ticket-${ticket.ticketNumber}.html`
    });

    // Update in database
    await prisma.ticket.update({
      where: { channelId: channel.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: closedBy.id,
        transcript: htmlTranscript
      }
    });

    // Log closing
    await LogService.logTicketAction(channel.guild, {
      action: 'إغلاق تذكرة',
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      userTag: creatorUser ? creatorUser.tag : ticket.creatorId,
      closedByTag: closedBy.user.tag,
      transcriptAttachment: attachment
    });

    // Send copy to ticket creator DM if possible
    if (creatorUser) {
      await creatorUser
        .send({
          embeds: [
            createEmbed({
              title: `🔒 تم إغلاق تذكرتك رقم #${ticket.ticketNumber}`,
              description: `سيرفر: **${channel.guild.name}**\nالقسم: **${ticket.category}**\nأغلقت بواسطة: **${closedBy.user.tag}**\n\nتجد مرفقاً نسخة كاملة من سجل المحادثة (Transcript).`,
              color: COLORS.DARK
            })
          ],
          files: [attachment]
        })
        .catch(() => null);
    }

    // Inform channel and countdown delete
    await channel.send({
      embeds: [
        createEmbed({
          title: '🔒 تم إغلاق التذكرة',
          description: 'تم إنشاء نسخة الـ Transcript وحفظها بنجاح.\nسيتم حذف القناة تلقائياً خلال **5 ثوانٍ**...',
          color: COLORS.DANGER
        })
      ]
    });

    setTimeout(async () => {
      await channel.delete('تم إغلاق التذكرة بنجاح').catch(() => null);
    }, 5000);
  }
}
