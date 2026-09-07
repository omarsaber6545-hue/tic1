import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import prisma from '../../database/prisma.js';
import { LevelService } from '../../services/levelService.js';
import { createSuccessEmbed } from '../../utils/arabic.js';

export const addXpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('إضافة-xp')
    .setDescription('إضافة نقاط خبرة (XP) لعضو والتحقق من الترقية')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد إضافة الـ XP له').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('الكمية').setDescription('كمية الـ XP المراد إضافتها').setMinValue(1).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const amount = interaction.options.getInteger('الكمية', true);

    const member = await prisma.member.upsert({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      },
      update: {},
      create: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        level: 1,
        xp: 0
      }
    });

    let newXp = member.xp + amount;
    let newLevel = member.level;
    let reqXp = LevelService.getRequiredXp(newLevel);

    while (newXp >= reqXp) {
      newXp -= reqXp;
      newLevel++;
      reqXp = LevelService.getRequiredXp(newLevel);
    }

    await prisma.member.update({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: targetUser.id
        }
      },
      data: {
        xp: newXp,
        level: newLevel
      }
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تمت إضافة نقاط الخبرة بنجاح ⚡',
          `تمت إضافة **${amount}** XP للعضو **${targetUser.tag}**.\nالمستوى الحالي: **${newLevel}** | الـ XP المتبقي للترقية: **${newXp}/${reqXp}**.`
        )
      ]
    });
  }
};
