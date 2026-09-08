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

    try {
      const botMember = guild.members.me || (await guild.members.fetchMe().catch(() => null));
      const botId = botMember?.id || guild.client.user?.id;

      if (botMember && !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return {
          success: false,
          message: 'البوت لا يمتلك صلاحية إدارة القنوات (Manage Channels)! يرجى منح رتبة البوت صلاحية Manage Channels في إعدادات السيرفر.'
        };
      }

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

      // Build permission overwrites safely
      const permissionOverwrites: any[] = [
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
        }
      ];

      if (botId) {
        permissionOverwrites.push({
          id: botId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }

      if (settings?.supportRoleId) {
        const role = await guild.roles.fetch(settings.supportRoleId).catch(() => null);
        if (role) {
          permissionOverwrites.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }
      }

      // Check if category exists and is valid
      let parentCategoryId: string | undefined = undefined;
      if (settings?.ticketCategoryId) {
        const cat = await guild.channels.fetch(settings.ticketCategoryId).catch(() => null);
        if (cat && cat.type === ChannelType.GuildCategory) {
          parentCategoryId = cat.id;
        }
      }

      // Create channel
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentCategoryId,
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

      // Set channel topic
      await channel.setTopic(
        `🎫 تذكرة #${ticketNumber} | 👤 العضو: ${member.user.tag} (${member.id}) | 🏷️ القسم: ${categoryInfo.label} | ⚡ الحالة: مفتوحة`
      ).catch(() => null);

      // Send welcome message in ticket
      const embed = createEmbed({
        title: `╭━━━━━━━━ 🎫 تـذكـرة رقـم #${ticketNumber} ━━━━━━━━╮`,
        description:
          `👋 مرحباً بك يا ${member}! تم فتح تذكرتك بنجاح وهي قيد انتظار استلام المشرف.\n\n` +
          `◈ ───────────────── 📋 بـيـانـات الـتـذكـرة ───────────────── ◈\n` +
          `┌ 👤 **صاحب التذكرة:** ${member} (\`${member.id}\`)\n` +
          `├ 🏷️ **القسم والتصنيف:** ${categoryInfo.emoji} **${categoryInfo.label}**\n` +
          `├ ⏰ **وقت الفتح:** <t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)\n` +
          `└ ⚡ **حالة التذكرة:** 🟢 **مفتوحة - في انتظار الاستلام**\n\n` +
          `◈ ───────────────── 💬 إرشـادات هـامـة ───────────────── ◈\n` +
          `> 🔹 ${settings?.ticketMessage || 'يرجى كتابة كافة تفاصيل طلبك أو استفسارك في رسالة واحدة واضحة لتسريع خدمتك.'}\n` +
          `> 🔹 إذا كان موضوعك يتعلق بمشكلة أو عملية دفع، يرجى إرفاق الصور والإثباتات مباشرة.\n` +
          `> 🔹 فريق الدعم سيتولى المتابعة معك قريباً، لا داعي لتكرار المنشن للإدارة.\n\n` +
          `◈ ──────────────────────────────────────────────────────── ◈\n` +
          `⚡ **تحكم بالتذكرة عبر لوحة الأزرار التفاعلية أدناه:**`,
        color: COLORS.PRIMARY
      })
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setFooter({
          text: `${guild.name} • نظام التذاكر المتطور | Horizon Services`,
          iconURL: guild.iconURL() || undefined
        });

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
          .setLabel('حفظ الـ Transcript')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Secondary)
      );

      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_rename_${channel.id}`)
          .setLabel('تعديل الاسم')
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
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`ticket_alert_${channel.id}`)
          .setLabel('تنبيه العضو')
          .setEmoji('🔔')
          .setStyle(ButtonStyle.Secondary)
      );

      await channel.send({
        content: `👋 أهلاً بك ${member}! تم فتح تذكرتك وسيقوم فريق الدعم بالرد عليك قريباً.`,
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
    } catch (error: any) {
      console.error('Error creating ticket channel:', error);
      let errorMsg = 'حدث خطأ غير متوقع أثناء إنشاء التذكرة.';
      if (error?.code === 50013) {
        errorMsg = 'البوت لا يمتلك الصلاحيات الكافية (Manage Channels / Manage Roles) لإنشاء غرفة التذكرة! تأكد من إعطاء رتبة البوت صلاحية Manage Channels ورفع رتبته.';
      } else if (error?.code === 50035) {
        errorMsg = 'حدث خطأ في معلمات إعدادات الروم (Invalid Form Body). يرجى التأكد من صحة قسم التذاكر المحدد.';
      }
      return {
        success: false,
        message: `${errorMsg}\n\`${error?.message || error}\``
      };
    }
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

    await channel.setTopic(
      `🎫 تذكرة #${ticket.ticketNumber} | 👤 العضو: <@${ticket.creatorId}> | 📌 المستلم: ${staffMember.user.tag} | 🟡 قيد المتابعة`
    ).catch(() => null);

    const embed = createEmbed({
      title: '📌 تم استلام التذكرة من قبل الإدارة',
      description:
        `قام المشرف **${staffMember.user}** باستلام هذه التذكرة وتولي مسؤولية الرد عليك ومتابعة طلبك.\n\n` +
        `◈ ───────────────── 👤 بـيـانـات الـمـشـرف ───────────────── ◈\n` +
        `┌ 👤 **المشرف المسؤول:** ${staffMember.user} (\`${staffMember.id}\`)\n` +
        `├ ⏰ **وقت الاستلام:** <t:${Math.floor(Date.now() / 1000)}:R>\n` +
        `└ ⚡ **حالة التذكرة:** 🟡 **قيد المتابعة والمعالجة**`,
      color: COLORS.WARNING
    }).setFooter({
      text: `${channel.guild.name} • Horizon Services`,
      iconURL: channel.guild.iconURL() || undefined
    });

    await channel.send({
      content: `🔔 مرحباً <@${ticket.creatorId}>، قام المشرف ${staffMember.user} باستلام تذكرتك وسيقوم بمساعدتك الآن!`,
      embeds: [embed]
    });

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
   * Alert ticket member to respond
   */
  public static async alertMember(
    channel: TextChannel,
    staffMember: GuildMember
  ): Promise<{ success: boolean; message: string }> {
    const ticket = await prisma.ticket.findUnique({
      where: { channelId: channel.id }
    });

    if (!ticket) {
      return { success: false, message: 'لم يتم العثور على بيانات التذكرة.' };
    }

    const embed = createEmbed({
      title: '🔔 تنبيه تذكيري لصاحب التذكرة',
      description:
        `مرحباً بك <@${ticket.creatorId}>! 👋\n\n` +
        `فريق الدعم بانتظار ردك وتزويدنا بالمزيد من التفاصيل لمتابعة استفسارك وحل مشكلتك.\n\n` +
        `> 💡 **ملاحظة:** إذا تم حل مشكلتك أو لم تعد بحاجة للمساعدة، يرجى الضغط على زر **🔒 إغلاق التذكرة** لتنظيم قنوات السيرفر.`,
      color: COLORS.GOLD
    }).setFooter({
      text: `${channel.guild.name} • Horizon Services`,
      iconURL: channel.guild.iconURL() || undefined
    });

    await channel.send({
      content: `🔔 تنبيه: <@${ticket.creatorId}> (بواسطة المشرف ${staffMember.user})`,
      embeds: [embed]
    });

    return { success: true, message: 'تم إرسال التنبيه التذكيري للعضو بنجاح.' };
  }

  /**
   * Close ticket and generate transcript
   */
  public static async closeTicket(
    channel: TextChannel,
    closedBy: GuildMember,
    reason?: string
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
      closedByTag: closedBy.user.tag,
      reason: reason || 'تم الانتهاء وحل المشكلة'
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
      const dmEmbed = createEmbed({
        title: `🔒 تم إغلاق تذكرتك رقم #${ticket.ticketNumber}`,
        description:
          `أهلاً بك **${creatorUser.username}**، نود إعلامك بأنه تم إغلاق تذكرتك في سيرفر **${channel.guild.name}**.\n\n` +
          `◈ ───────────────── 📋 تفاصيل الإغلاق ───────────────── ◈\n` +
          `┌ 🏷️ **القسم والتصنيف:** ${ticket.category}\n` +
          `├ 👤 **أغلقت بواسطة:** ${closedBy.user.tag}\n` +
          `├ 📝 **سبب الإغلاق:** ${reason || 'تم الانتهاء وحل المشكلة'}\n` +
          `└ ⏰ **وقت الإغلاق:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
          `📄 **تجد مرفقاً نسخة كاملة موثقة من سجل المحادثة (Transcript) للرجوع إليها في أي وقت.**`,
        color: COLORS.DARK
      }).setFooter({
        text: `${channel.guild.name} • Horizon Services`,
        iconURL: channel.guild.iconURL() || undefined
      });

      await creatorUser
        .send({
          embeds: [dmEmbed],
          files: [attachment]
        })
        .catch(() => null);
    }

    // Inform channel and countdown delete
    const closeChannelEmbed = createEmbed({
      title: '🔒 تم تأكيد إغلاق التذكرة',
      description:
        `تم حفظ سجل المحادثة (Transcript) وإرسال نسخة لصاحب التذكرة في الخاص.\n\n` +
        `📝 **سبب الإغلاق:** ${reason || 'تم الانتهاء وحل المشكلة'}\n` +
        `👤 **أغلقت بواسطة:** ${closedBy.user}\n\n` +
        `⏳ **سيتم حذف القناة نهائياً خلال 5 ثوانٍ...**`,
      color: COLORS.DANGER
    }).setFooter({
      text: `${channel.guild.name} • Horizon Services`,
      iconURL: channel.guild.iconURL() || undefined
    });

    await channel.send({ embeds: [closeChannelEmbed] });

    setTimeout(async () => {
      await channel.delete('تم إغلاق التذكرة وحفظ سجل المحادثة').catch(() => null);
    }, 5000);
  }
}
