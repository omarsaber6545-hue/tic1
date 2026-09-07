import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import prisma from '../../database/prisma.js';
import { createSuccessEmbed } from '../../utils/arabic.js';

export const setLevelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تعيين-مستوى')
    .setDescription('تعيين المستوى لعضو محدد وتصفير الـ XP')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد تعيين مستواه').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('المستوى').setDescription('المستوى الجديد المراد تعيينه').setMinValue(1).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const level = interaction.options.getInteger('المستوى', true);

    await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      },
      update: {
        level,
        xp: 0
      },
      create: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        level,
        xp: 0
      }
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم تعيين المستوى بنجاح 🎖️',
          `تم ضبط مستوى العضو **${targetUser.tag}** ليصبح المستوى: **${level}**.`
        )
      ]
    });
  }
};
