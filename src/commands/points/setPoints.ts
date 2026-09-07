import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import prisma from '../../database/prisma.js';
import { createSuccessEmbed } from '../../utils/arabic.js';

export const setPointsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تعيين-نقاط')
    .setDescription('تحديد رصيد نقاط لعضو برقم محدد')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد تعيين نقاطه').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('الكمية').setDescription('عدد النقاط الجديد').setMinValue(0).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const amount = interaction.options.getInteger('الكمية', true);

    await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      },
      update: { points: amount },
      create: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        points: amount
      }
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم تعيين النقاط بنجاح',
          `تم ضبط رصيد نقاط العضو **${targetUser.tag}** ليصبح: **${amount}** نقطة.`
        )
      ]
    });
  }
};
