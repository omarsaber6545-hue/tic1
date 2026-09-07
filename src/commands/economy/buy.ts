import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { EconomyService } from '../../services/economyService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const buyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('شراء')
    .setDescription('شراء منتج أو رتبة من متجر السيرفر')
    .addIntegerOption((option) =>
      option.setName('رقم-المنتج').setDescription('رقم المنتج من المتجر (Item ID)').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const itemId = interaction.options.getInteger('رقم-المنتج', true);
    const member = interaction.member as GuildMember;

    const result = await EconomyService.buyItem(interaction.guild, member, itemId);

    if (!result.success) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشلت عملية الشراء', result.message)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [createSuccessEmbed('عملية شراء ناجحة', result.message)]
    });
  }
};
