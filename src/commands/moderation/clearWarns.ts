import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed } from '../../utils/arabic.js';

export const clearWarnsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('مسح-تحذيرات')
    .setDescription('تصفير ومسح كافة التحذيرات المسجلة بحق عضو')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد مسح كافة تحذيراته').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const count = await ModerationService.clearWarnings(interaction.guild.id, targetUser.id);

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم مسح التحذيرات',
          `تم مسح **${count}** تحذير مسجل بحق العضو **${targetUser.tag}** وتصفير سجله بالكامل!`
        )
      ]
    });
  }
};
