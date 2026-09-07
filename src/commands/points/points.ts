import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import prisma from '../../database/prisma.js';
import { createEmbed, formatNumber } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const pointsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('نقاط')
    .setDescription('عرض رصيد النقاط والمستوى لك أو لعضو آخر')
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد معرفة نقاطه (افتراضياً أنت)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو') || interaction.user;
    const memberData = await prisma.member.findUnique({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      }
    });

    const points = memberData?.points || 0;
    const level = memberData?.level || 1;
    const xp = memberData?.xp || 0;

    const embed = createEmbed({
      title: `⭐ بيانات النقاط والمستوى: ${targetUser.username}`,
      color: COLORS.GOLD
    })
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: '✨ عدد النقاط:', value: `**${formatNumber(points)}** نقطة`, inline: true },
        { name: '🎖️ المستوى الحالي:', value: `المستوى **${level}**`, inline: true },
        { name: '⚡ نقاط الخبرة (XP):', value: `${formatNumber(xp)} XP`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
