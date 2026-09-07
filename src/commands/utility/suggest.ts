import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { SuggestionService } from '../../services/suggestionService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const suggestCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('اقتراح')
    .setDescription('إرسال فكرة أو اقتراح جديد لتطوير السيرفر')
    .addStringOption((option) =>
      option.setName('النص').setDescription('نص وتفاصيل الاقتراح').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const content = interaction.options.getString('النص', true);
    const member = interaction.member as GuildMember;

    const result = await SuggestionService.createSuggestion(
      interaction.guild,
      member,
      content
    );

    if (!result.success) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل إرسال الاقتراح', result.message)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [createSuccessEmbed('تم إرسال الاقتراح بنجاح', result.message)],
      ephemeral: true
    });
  }
};
