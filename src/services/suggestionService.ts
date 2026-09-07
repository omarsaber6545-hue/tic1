import {
  Guild,
  GuildMember,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  PermissionFlagsBits
} from 'discord.js';
import prisma from '../database/prisma.js';
import { createEmbed, createErrorEmbed, createSuccessEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export class SuggestionService {
  /**
   * Submit a new suggestion
   */
  public static async createSuggestion(
    guild: Guild,
    member: GuildMember,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId: guild.id }
    });

    if (!settings?.suggestionChannelId) {
      return {
        success: false,
        message: 'لم يتم تحديد روم مخصص للاقتراحات بعد! يرجى تحديده من لوحة التحكم أو إعدادات السيرفر.'
      };
    }

    const channel = await guild.channels
      .fetch(settings.suggestionChannelId)
      .catch(() => null);

    if (!channel || !(channel instanceof TextChannel)) {
      return { success: false, message: 'تعذر الوصول إلى روم الاقتراحات المحدد!' };
    }

    const embed = createEmbed({
      title: '💡 اقتراح جديد',
      description: content,
      color: COLORS.WARNING
    })
      .setAuthor({
        name: member.user.username,
        iconURL: member.user.displayAvatarURL()
      })
      .addFields(
        { name: '📊 الحالة:', value: '🟡 قيد المراجعة والدراسة', inline: true },
        { name: '👍 موافق:', value: '0', inline: true },
        { name: '👎 غير موافق:', value: '0', inline: true }
      );

    const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('suggestion_upvote')
        .setLabel('موافق (0)')
        .setEmoji('👍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('suggestion_downvote')
        .setLabel('غير موافق (0)')
        .setEmoji('👎')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('suggestion_manage')
        .setLabel('إدارة الاقتراح')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Secondary)
    );

    const sentMessage = await channel.send({
      embeds: [embed],
      components: [voteRow]
    });

    await prisma.suggestion.create({
      data: {
        guildId: guild.id,
        channelId: channel.id,
        messageId: sentMessage.id,
        authorId: member.id,
        content,
        status: 'PENDING',
        upvoters: '[]',
        downvoters: '[]'
      }
    });

    return { success: true, message: `تم إرسال اقتراحك بنجاح في الروم ${channel}!` };
  }

  /**
   * Handle Upvote / Downvote interaction
   */
  public static async handleVote(
    interaction: ButtonInteraction,
    type: 'up' | 'down'
  ): Promise<void> {
    const suggestion = await prisma.suggestion.findUnique({
      where: { messageId: interaction.message.id }
    });

    if (!suggestion) {
      await interaction.reply({
        content: 'لم يتم العثور على هذا الاقتراح في قاعدة البيانات.',
        ephemeral: true
      });
      return;
    }

    if (suggestion.status !== 'PENDING') {
      await interaction.reply({
        content: 'تم إغلاق التصويت على هذا الاقتراح بالفعل.',
        ephemeral: true
      });
      return;
    }

    const userId = interaction.user.id;
    let upvoters: string[] = JSON.parse(suggestion.upvoters || '[]');
    let downvoters: string[] = JSON.parse(suggestion.downvoters || '[]');

    if (type === 'up') {
      if (upvoters.includes(userId)) {
        // Remove vote
        upvoters = upvoters.filter((id) => id !== userId);
      } else {
        upvoters.push(userId);
        downvoters = downvoters.filter((id) => id !== userId);
      }
    } else {
      if (downvoters.includes(userId)) {
        // Remove vote
        downvoters = downvoters.filter((id) => id !== userId);
      } else {
        downvoters.push(userId);
        upvoters = upvoters.filter((id) => id !== userId);
      }
    }

    const updated = await prisma.suggestion.update({
      where: { messageId: interaction.message.id },
      data: {
        upvotes: upvoters.length,
        downvotes: downvoters.length,
        upvoters: JSON.stringify(upvoters),
        downvoters: JSON.stringify(downvoters)
      }
    });

    // Update Embed & Buttons
    const originalEmbed = interaction.message.embeds[0];
    const newEmbed = createEmbed({
      title: originalEmbed.title || '💡 اقتراح جديد',
      description: suggestion.content,
      color: COLORS.WARNING
    })
      .setAuthor(originalEmbed.author)
      .addFields(
        { name: '📊 الحالة:', value: '🟡 قيد المراجعة والدراسة', inline: true },
        { name: '👍 موافق:', value: `${updated.upvotes}`, inline: true },
        { name: '👎 غير موافق:', value: `${updated.downvotes}`, inline: true }
      );

    const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('suggestion_upvote')
        .setLabel(`موافق (${updated.upvotes})`)
        .setEmoji('👍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('suggestion_downvote')
        .setLabel(`غير موافق (${updated.downvotes})`)
        .setEmoji('👎')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('suggestion_manage')
        .setLabel('إدارة الاقتراح')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
      embeds: [newEmbed],
      components: [voteRow]
    });
  }

  /**
   * Handle admin management modal for accepting/rejecting
   */
  public static async showManageModal(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: 'عذراً، يجب أن تمتلك صلاحية إدارة السيرفر لإدارة الاقتراحات.',
        ephemeral: true
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`modal_manage_suggestion_${interaction.message.id}`)
      .setTitle('إدارة الاقتراح');

    const statusInput = new TextInputBuilder()
      .setCustomId('action_type')
      .setLabel('الإجراء (اكتب: قبول أو رفض)')
      .setPlaceholder('قبول / رفض')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('action_reason')
      .setLabel('سبب القبول أو الرفض')
      .setPlaceholder('اكتب توضيحاً للعضو وللسيرفر...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(statusInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
    );

    await interaction.showModal(modal);
  }

  /**
   * Handle Modal submit to accept/reject
   */
  public static async handleManageSubmit(
    interaction: ModalSubmitInteraction,
    messageId: string
  ): Promise<void> {
    const actionType = interaction.fields.getTextInputValue('action_type').trim();
    const reason = interaction.fields.getTextInputValue('action_reason') || 'لا يوجد سبب محدد';

    const isAccepted = actionType.includes('قبول');
    const isRejected = actionType.includes('رفض');

    if (!isAccepted && !isRejected) {
      await interaction.reply({
        content: 'يرجى كتابة كلمة "قبول" أو "رفض" في خانة الإجراء.',
        ephemeral: true
      });
      return;
    }

    const newStatus = isAccepted ? 'APPROVED' : 'REJECTED';

    const suggestion = await prisma.suggestion.update({
      where: { messageId },
      data: {
        status: newStatus,
        reason
      }
    });

    const statusText = isAccepted ? '🟢 تم قبول الاقتراح بنجاح' : '🔴 تم رفض الاقتراح';
    const embedColor = isAccepted ? COLORS.SUCCESS : COLORS.DANGER;

    const message = await interaction.channel?.messages.fetch(messageId).catch(() => null);
    if (message) {
      const updatedEmbed = createEmbed({
        title: isAccepted ? '💡 اقتراح مقبول' : '💡 اقتراح مرفوض',
        description: suggestion.content,
        color: embedColor
      })
        .setAuthor(message.embeds[0]?.author || null)
        .addFields(
          { name: '📊 الحالة:', value: statusText, inline: true },
          { name: '👍 موافق:', value: `${suggestion.upvotes}`, inline: true },
          { name: '👎 غير موافق:', value: `${suggestion.downvotes}`, inline: true },
          { name: '💬 تعليق الإدارة:', value: reason, inline: false },
          { name: '👮 بواسطة المشرف:', value: interaction.user.tag, inline: true }
        );

      await message.edit({
        embeds: [updatedEmbed],
        components: [] // remove voting buttons
      });
    }

    await interaction.reply({
      content: `تم ${isAccepted ? 'قبول' : 'رفض'} الاقتراح وتحديث حالته بنجاح.`,
      ephemeral: true
    });
  }
}
