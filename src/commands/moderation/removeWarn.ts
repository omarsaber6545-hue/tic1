import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/arabic.js';

export const removeWarnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('إزالة-تحذير')
    .setDescription('حذف تحذير محدد بواسطة رقم التحذير')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addIntegerOption((option) =>
      option.setName('رقم-التحذير').setDescription('رقم التحذير المراد حذفه').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const warnId = interaction.options.getInteger('رقم-التحذير', true);
    const removed = await ModerationService.removeWarning(interaction.guild.id, warnId);

    if (!removed) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', `لم يتم العثور على تحذير بالرقم #${warnId} في هذا السيرفر.`)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم حذف التحذير بنجاح',
          `تمت إزالة التحذير رقم **#${warnId}** من سجلات العضو.`
        )
      ]
    });
  }
};
