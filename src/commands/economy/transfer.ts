import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { EconomyService } from '../../services/economyService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const transferCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تحويل')
    .setDescription('تحويل عملات من محفظتك إلى عضو آخر في السيرفر')
    .addUserOption((option) =>
      option.setName('المستلم').setDescription('العضو المراد التحويل له').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('المبلغ').setDescription('المبلغ المراد تحويله').setMinValue(1).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const receiver = interaction.options.getUser('المستلم', true);
    const amount = interaction.options.getInteger('المبلغ', true);

    if (receiver.bot) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'لا يمكنك تحويل العملات للبوتات!')],
        ephemeral: true
      });
      return;
    }

    const result = await EconomyService.transferCoins(
      interaction.guild.id,
      interaction.user.id,
      receiver.id,
      amount
    );

    if (!result.success) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل التحويل', result.message)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed('تمت عملية التحويل بنجاح 💸', result.message)
      ]
    });
  }
};
