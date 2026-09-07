import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LogService } from '../../services/logService.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/arabic.js';

export const clearCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('مسح')
    .setDescription('حذف عدد محدد من الرسائل في الروم الحالي')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName('العدد')
        .setDescription('عدد الرسائل المراد حذفها (بين 1 و 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((option) =>
      option.setName('العضو').setDescription('تصفية وحذف رسائل هذا العضو فقط').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel || !(interaction.channel instanceof TextChannel)) return;

    const count = interaction.options.getInteger('العدد', true);
    const targetUser = interaction.options.getUser('العضو');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messagesToDelete;

      if (targetUser) {
        const fetched = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = fetched.filter((m) => m.author.id === targetUser.id);
        messagesToDelete = userMessages.first(count);
      } else {
        messagesToDelete = count;
      }

      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

      await LogService.logModerationAction(interaction.guild, {
        action: 'مسح رسائل (Purge)',
        moderatorTag: interaction.user.tag,
        targetTag: targetUser ? targetUser.tag : 'الجميع',
        targetId: targetUser ? targetUser.id : interaction.channel.id,
        reason: `مسح ${deleted.size} رسالة في الروم #${interaction.channel.name}`
      });

      await interaction.editReply({
        embeds: [
          createSuccessEmbed(
            'تم مسح الرسائل بنجاح',
            `تم حذف **${deleted.size}** رسالة ${targetUser ? `خاصة بالعضو **${targetUser.tag}**` : ''} بنجاح.`
          )
        ]
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            'فشل مسح الرسائل',
            'تعذر مسح الرسائل. يرجى ملاحظة أن ديسكورد لا يسمح بمسح الرسائل التي مضى عليها أكثر من 14 يوماً دفعة واحدة.'
          )
        ]
      });
    }
  }
};
