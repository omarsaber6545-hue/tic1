import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LevelService } from '../../services/levelService.js';
import { createEmbed, formatNumber } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('المتصدرين')
    .setDescription('عرض قائمة الأعضاء الأوائل في السيرفر حسب النقاط أو المستوى')
    .addStringOption((option) =>
      option
        .setName('النوع')
        .setDescription('الترتيب بحسب ماذا')
        .setRequired(true)
        .addChoices(
          { name: 'المستوى (Level)', value: 'level' },
          { name: 'النقاط (Points)', value: 'points' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const type = interaction.options.getString('النوع', true) as 'level' | 'points';
    const topMembers = await LevelService.getLeaderboard(interaction.guild.id, type, 10);

    if (topMembers.length === 0) {
      await interaction.reply({
        content: 'لا توجد بيانات تفاعل مسجلة في هذا السيرفر بعد.'
      });
      return;
    }

    const typeLabel = type === 'level' ? 'المستويات' : 'النقاط';
    const embed = createEmbed({
      title: `🏆 قائمة المتصدرين في السيرفر • ${typeLabel}`,
      description: `أفضل الأعضاء تفاعلاً ونشاطاً في **${interaction.guild.name}**:\n`,
      color: COLORS.GOLD
    });

    const medals = ['🥇', '🥈', '🥉'];

    topMembers.forEach((m, index) => {
      const medal = medals[index] || `**#${index + 1}**`;
      const valueText =
        type === 'level'
          ? `المستوى **${m.level}** (${formatNumber(m.xp)} XP)`
          : `**${formatNumber(m.points)}** نقطة (المستوى ${m.level})`;

      embed.addFields({
        name: `${medal} العضو: <@${m.userId}>`,
        value: valueText,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
