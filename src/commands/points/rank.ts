import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LevelService } from '../../services/levelService.js';
import { createEmbed } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const rankCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('رتبتي')
    .setDescription('عرض بطاقة الرتبة والمستوى وتقدم الـ XP')
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد استعراض بطاقته (افتراضياً أنت)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('العضو') || interaction.user;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.editReply({ content: 'تعذر العثور على بيانات العضو في السيرفر.' });
      return;
    }

    const { data, attachment } = await LevelService.getRankCard(interaction.guild, targetMember);

    const embed = createEmbed({
      title: `🎖️ بطاقة الرتبة: ${data.username}`,
      color: COLORS.PRIMARY
    })
      .addFields(
        { name: '🏆 الترتيب بالسيرفر:', value: `#${data.rank}`, inline: true },
        { name: '🎖️ المستوى الحالي:', value: `${data.level}`, inline: true },
        { name: '⭐ النقاط:', value: `${data.points}`, inline: true },
        { name: '⚡ الخبرة (XP):', value: `${data.currentXp} / ${data.requiredXp}`, inline: true }
      )
      .setImage('attachment://rank-card.svg');

    await interaction.editReply({
      embeds: [embed],
      files: [attachment]
    });
  }
};
