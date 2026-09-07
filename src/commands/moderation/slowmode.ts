import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel
} from 'discord.js';
import { Command } from '../../types/command.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const slowmodeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('بطء')
    .setDescription('تحديد وضع التهدئة والبطء (Slowmode) في الروم')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((option) =>
      option
        .setName('الثواني')
        .setDescription('عدد الثواني بين كل رسالة والأخرى (0 لإلغاء التهدئة)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel || !(interaction.channel instanceof TextChannel)) return;

    const seconds = interaction.options.getInteger('الثواني', true);

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        await interaction.reply({
          embeds: [createSuccessEmbed('تم إلغاء وضع التهدئة', 'يمكن للأعضاء الآن إرسال الرسائل بشكل طبيعي دون انتظار.')]
        });
      } else {
        await interaction.reply({
          embeds: [
            createSuccessEmbed(
              'تم تفعيل وضع التهدئة ⏱️',
              `تم ضبط وضع البطء على **${seconds}** ثانية بين كل رسالة وأخرى في هذا الروم.`
            )
          ]
        });
      }
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر تغيير وضع التهدئة للروم.')],
        ephemeral: true
      });
    }
  }
};
