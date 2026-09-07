import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LevelService } from '../../services/levelService.js';
import { createSuccessEmbed, createWarningEmbed, formatDuration } from '../../utils/arabic.js';

export const dailyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('يومي')
    .setDescription('الحصول على مكافأتك اليومية المجانية من النقاط والعملات'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const result = await LevelService.claimDaily(interaction.guild.id, interaction.user.id);

    if (!result.success) {
      const waitTime = formatDuration(result.nextClaimSeconds || 0);
      await interaction.reply({
        embeds: [
          createWarningEmbed(
            'لقد استلمت مكافأتك اليومية بالفعل!',
            `يرجى الانتظار مدة **${waitTime}** قبل استلام المكافأة القادمة.`
          )
        ],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم استلام المكافأة اليومية! 🎁',
          `مبروك! حصلت على **${result.amount}** نقطة وعملة في رصيدك.\nيمكنك العودة بعد 24 ساعة للحصول على مكافأة جديدة!`
        )
      ]
    });
  }
};
