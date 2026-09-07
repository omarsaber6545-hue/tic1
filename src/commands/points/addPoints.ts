import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import prisma from '../../database/prisma.js';
import { createSuccessEmbed } from '../../utils/arabic.js';

export const addPointsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('إضافة-نقاط')
    .setDescription('إضافة نقاط لرصيد عضو في السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد إضافة النقاط له').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('الكمية').setDescription('عدد النقاط المراد إضافتها').setMinValue(1).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const amount = interaction.options.getInteger('الكمية', true);

    const updated = await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      },
      update: { points: { increment: amount } },
      create: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        points: amount
      }
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تمت إضافة النقاط بنجاح ⭐',
          `تمت إضافة **${amount}** نقطة للعضو **${targetUser.tag}**.\nإجمالي نقاطه الحالية: **${updated.points}** نقطة.`
        )
      ]
    });
  }
};
