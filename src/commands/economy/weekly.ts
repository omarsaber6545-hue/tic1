import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LevelService } from '../../services/levelService.js';
import { createSuccessEmbed, createWarningEmbed, formatDuration } from '../../utils/arabic.js';

export const weeklyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('أسبوعي')
    .setDescription('الحصول على الراتب والمكافأة الأسبوعية الكبرى'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const result = await LevelService.claimWeekly(interaction.guild.id, interaction.user.id);

    if (!result.success) {
      const waitTime = formatDuration(result.nextClaimSeconds || 0);
      await interaction.reply({
        embeds: [
          createWarningEmbed(
            'لقد استلمت مكافأتك الأسبوعية بالفعل!',
            `يرجى الانتظار مدة **${waitTime}** قبل استلام المكافأة الأسبوعية القادمة.`
          )
        ],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'تم استلام المكافأة الأسبوعية! 💎',
          `تهانينا! حصلت على **${result.amount}** في رصيدك كمكافأة لنشاطك المستمر في السيرفر!`
        )
      ]
    });
  }
};
