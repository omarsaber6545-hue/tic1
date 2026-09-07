import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { EconomyService } from '../../services/economyService.js';
import { createEmbed, formatNumber } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const balanceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('رصيدي')
    .setDescription('عرض رصيدك المالي في المحفظة والبنك')
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد فحص رصيده (افتراضياً أنت)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو') || interaction.user;
    const balanceInfo = await EconomyService.getMemberBalance(interaction.guild.id, targetUser.id);

    const embed = createEmbed({
      title: `💰 الحساب المالي: ${targetUser.username}`,
      color: COLORS.SUCCESS
    })
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .addFields(
        {
          name: '💵 المحفظة (الكاش):',
          value: `**${formatNumber(balanceInfo.balance)}** ${balanceInfo.currencySymbol} ${balanceInfo.currencyName}`,
          inline: true
        },
        {
          name: '🏦 الحساب البنكي:',
          value: `**${formatNumber(balanceInfo.bank)}** ${balanceInfo.currencySymbol} ${balanceInfo.currencyName}`,
          inline: true
        },
        {
          name: '💎 إجمالي الثروة:',
          value: `**${formatNumber(balanceInfo.total)}** ${balanceInfo.currencySymbol} ${balanceInfo.currencyName}`,
          inline: false
        }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
