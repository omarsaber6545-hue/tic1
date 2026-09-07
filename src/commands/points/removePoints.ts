import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import prisma from '../../database/prisma.js';
import { createSuccessEmbed } from '../../utils/arabic.js';

export const removePointsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('خصم-نقاط')
    .setDescription('خصم نقاط من رصيد عضو في السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد الخصم منه').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('الكمية').setDescription('عدد النقاط المراد خصمها').setMinValue(1).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const amount = interaction.options.getInteger('الكمية', true);

    const member = await prisma.member.findUnique({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      }
    });

    const currentPoints = member?.points || 0;
    const newPoints = Math.max(0, currentPoints - amount);

    await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      },
      update: { points: newPoints },
      create: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        points: 0
      }
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم خصم النقاط بنجاح',
          `تم خصم **${amount}** نقطة من رصيد العضو **${targetUser.tag}**.\nإجمالي نقاطه الحالية: **${newPoints}** نقطة.`
        )
      ]
    });
  }
};
