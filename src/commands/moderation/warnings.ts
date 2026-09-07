import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { createEmbed } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const warningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تحذيرات')
    .setDescription('عرض قائمة التحذيرات المسجلة بحق عضو')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد استعراض تحذيراته').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const warnings = await ModerationService.getWarnings(interaction.guild.id, targetUser.id);

    if (warnings.length === 0) {
      await interaction.reply({
        embeds: [
          createEmbed({
            title: `سجل تحذيرات العضو: ${targetUser.tag}`,
            description: '✅ هذا العضو سجله نظيف ولا توجد عليه أي تحذيرات سابقة!',
            color: COLORS.SUCCESS
          })
        ]
      });
      return;
    }

    const embed = createEmbed({
      title: `⚠️ سجل تحذيرات العضو: ${targetUser.tag} (${warnings.length} تحذيرات)`,
      color: COLORS.WARNING
    });

    warnings.slice(0, 15).forEach((w) => {
      const timeStr = `<t:${Math.floor(w.createdAt.getTime() / 1000)}:d>`;
      embed.addFields({
        name: `تحذير رقم #${w.id} • ${timeStr}`,
        value: `**السبب:** ${w.reason}\n**المشرف:** <@${w.moderatorId}>`,
        inline: false
      });
    });

    if (warnings.length > 15) {
      embed.setFooter({ text: `يوجد ${warnings.length - 15} تحذيرات إضافية لم تُعرض.` });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
