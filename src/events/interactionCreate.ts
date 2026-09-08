import {
  Interaction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  GuildMember,
  TextChannel,
  AttachmentBuilder
} from 'discord.js';
import { commandMap } from '../commands/index.js';
import { TicketService } from '../services/ticketService.js';
import { SuggestionService } from '../services/suggestionService.js';
import { GiveawayService } from '../services/giveawayService.js';
import { generateHtmlTranscript } from '../utils/transcript.js';
import { createEmbed, createErrorEmbed, createSuccessEmbed } from '../utils/arabic.js';
import { COLORS, TICKET_CATEGORIES } from '../config/constants.js';

export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  // 1. Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[Command Error: /${interaction.commandName}]`, err);
      const errorEmbed = createErrorEmbed(
        'حدث خطأ غير متوقع',
        'تعذر إكمال تنفيذ هذا الأمر بنجاح. يرجى المحاولة لاحقاً.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  // 2. Button Interactions
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // A. Open Ticket Panel -> Show Select Menu
    if (customId === 'ticket_open_menu') {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_select_category')
        .setPlaceholder('اختر قسم التذكرة من القائمة أدناه...')
        .addOptions(
          TICKET_CATEGORIES.map((cat) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(cat.label)
              .setDescription(cat.description)
              .setEmoji(cat.emoji)
              .setValue(cat.id)
          )
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.reply({
        content: 'يرجى اختيار القسم الأنسب لموضوع تذكرتك:',
        components: [row],
        ephemeral: true
      });
      return;
    }

    // B. Claim Ticket
    if (customId.startsWith('ticket_claim_')) {
      const channel = interaction.channel as TextChannel;
      const member = interaction.member as GuildMember;
      const result = await TicketService.claimTicket(channel, member);

      await interaction.reply({
        content: result.message,
        ephemeral: true
      });
      return;
    }

    // C. Close Ticket Prompt
    if (customId.startsWith('ticket_close_')) {
      const channelId = customId.replace('ticket_close_', '');
      const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_confirm_close_${channelId}`)
          .setLabel('تأكيد الإغلاق وحفظ السجل')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ticket_cancel_close_${channelId}`)
          .setLabel('إلغاء')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: '⚠️ هل أنت متأكد من رغبتك في إغلاق هذه التذكرة؟ سيتم حفظ نسخة المحادثة وحذف الروم.',
        components: [confirmRow]
      });
      return;
    }

    // D. Confirm Close Ticket
    if (customId.startsWith('ticket_confirm_close_')) {
      const channel = interaction.channel as TextChannel;
      const member = interaction.member as GuildMember;
      await interaction.update({
        content: '⏳ جاري إغلاق التذكرة وتوليد سجل المحادثة (Transcript)...',
        components: []
      });

      await TicketService.closeTicket(channel, member);
      return;
    }

    // E. Cancel Close Ticket
    if (customId.startsWith('ticket_cancel_close_')) {
      await interaction.message.delete().catch(() => null);
      return;
    }

    // F. Instant Transcript Download
    if (customId.startsWith('ticket_transcript_')) {
      const channel = interaction.channel as TextChannel;
      await interaction.deferReply({ ephemeral: true });

      const htmlTranscript = await generateHtmlTranscript(channel, {
        ticketNumber: 0,
        category: 'تذكرة',
        creatorTag: 'العضو',
        closedByTag: interaction.user.tag
      });

      const buffer = Buffer.from(htmlTranscript, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: 'transcript.html' });

      await interaction.editReply({
        content: '📄 تفضل، نسخة الـ Transcript الحالية للمحادثة:',
        files: [attachment]
      });
      return;
    }

    // G. Rename Ticket Modal
    if (customId.startsWith('ticket_rename_')) {
      const modal = new ModalBuilder()
        .setCustomId(`modal_rename_ticket_${interaction.channelId}`)
        .setTitle('تغيير اسم التذكرة');

      const nameInput = new TextInputBuilder()
        .setCustomId('new_name')
        .setLabel('الاسم الجديد لروم التذكرة')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
      await interaction.showModal(modal);
      return;
    }

    // H. Add User to Ticket Modal
    if (customId.startsWith('ticket_adduser_')) {
      const modal = new ModalBuilder()
        .setCustomId(`modal_adduser_ticket_${interaction.channelId}`)
        .setTitle('إضافة عضو للتذكرة');

      const userInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('معرف العضو المراد إضافته (User ID)')
        .setPlaceholder('مثال: 123456789012345678')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(userInput));
      await interaction.showModal(modal);
      return;
    }

    // I. Remove User from Ticket Modal
    if (customId.startsWith('ticket_removeuser_')) {
      const modal = new ModalBuilder()
        .setCustomId(`modal_removeuser_ticket_${interaction.channelId}`)
        .setTitle('إزالة عضو من التذكرة');

      const userInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('معرف العضو المراد إزالته (User ID)')
        .setPlaceholder('مثال: 123456789012345678')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(userInput));
      await interaction.showModal(modal);
      return;
    }

    // J. Suggestions Voting
    if (customId === 'suggestion_upvote') {
      await SuggestionService.handleVote(interaction, 'up');
      return;
    }
    if (customId === 'suggestion_downvote') {
      await SuggestionService.handleVote(interaction, 'down');
      return;
    }
    if (customId === 'suggestion_manage') {
      await SuggestionService.showManageModal(interaction);
      return;
    }

    // K. Giveaway Entry
    if (customId === 'giveaway_enter') {
      await GiveawayService.handleEnter(interaction);
      return;
    }
  }

  // 3. Select Menu Interactions
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_select_category') {
      const categoryKey = interaction.values[0];
      const member = interaction.member as GuildMember;

      try {
        await interaction.deferReply({ ephemeral: true });

        const result = await TicketService.createTicket(
          interaction.guild!,
          member,
          categoryKey
        );

        if (!result.success) {
          await interaction.editReply({
            embeds: [createErrorEmbed('تعذر فتح التذكرة', result.message)]
          });
          return;
        }

        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              'تم إنشاء تذكرتك بنجاح!',
              `تم فتح الروم المخصص لتذكرتك: ${result.channel}`
            )
          ]
        });
      } catch (error: any) {
        console.error('Error in ticket_select_category interaction:', error);
        const errMsg = error?.message || 'حدث خطأ أثناء معالجة طلب فتح التذكرة.';
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            embeds: [createErrorEmbed('خطأ في النظام', `تعذر إتمام طلبك:\n\`${errMsg}\``)]
          }).catch(console.error);
        } else {
          await interaction.reply({
            embeds: [createErrorEmbed('خطأ في النظام', `تعذر إتمام طلبك:\n\`${errMsg}\``)],
            ephemeral: true
          }).catch(console.error);
        }
      }
      return;
    }
  }

  // 4. Modal Submit Interactions
  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;

    // Suggestion manage submit
    if (customId.startsWith('modal_manage_suggestion_')) {
      const messageId = customId.replace('modal_manage_suggestion_', '');
      await SuggestionService.handleManageSubmit(interaction, messageId);
      return;
    }

    // Rename ticket submit
    if (customId.startsWith('modal_rename_ticket_')) {
      const newName = interaction.fields.getTextInputValue('new_name').trim();
      const channel = interaction.channel as TextChannel;

      await channel.setName(newName);
      await interaction.reply({
        content: `✅ تم تغيير اسم الروم إلى: **${newName}**`,
        ephemeral: true
      });
      return;
    }

    // Add user submit
    if (customId.startsWith('modal_adduser_ticket_')) {
      const userId = interaction.fields.getTextInputValue('user_id').trim();
      const channel = interaction.channel as TextChannel;
      const targetUser = await interaction.guild?.members.fetch(userId).catch(() => null);

      if (!targetUser) {
        await interaction.reply({
          content: '❌ لم يتم العثور على عضو بهذا المعرف في السيرفر.',
          ephemeral: true
        });
        return;
      }

      await channel.permissionOverwrites.edit(targetUser, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true
      });

      await channel.send(`➕ تم إضافة العضو ${targetUser} إلى التذكرة بواسطة ${interaction.user}.`);
      await interaction.reply({
        content: `✅ تمت إضافة ${targetUser.user.username} إلى التذكرة.`,
        ephemeral: true
      });
      return;
    }

    // Remove user submit
    if (customId.startsWith('modal_removeuser_ticket_')) {
      const userId = interaction.fields.getTextInputValue('user_id').trim();
      const channel = interaction.channel as TextChannel;
      const targetUser = await interaction.guild?.members.fetch(userId).catch(() => null);

      if (!targetUser) {
        await interaction.reply({
          content: '❌ لم يتم العثور على عضو بهذا المعرف.',
          ephemeral: true
        });
        return;
      }

      await channel.permissionOverwrites.delete(targetUser);
      await channel.send(`➖ تم إخراج العضو ${targetUser.user.username} من التذكرة بواسطة ${interaction.user}.`);
      await interaction.reply({
        content: `✅ تم سحب صلاحيات العضو من التذكرة.`,
        ephemeral: true
      });
      return;
    }
  }
}
