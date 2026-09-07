import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel
} from 'discord.js';
import { Command } from '../../types/command.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const unlockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('فتح')
    .setDescription('فتح الروم والسماح للأعضاء بإرسال الرسائل')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option.setName('الروم').setDescription('الروم المراد فتحه (افتراضياً الروم الحالي)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = (interaction.options.getChannel('الروم') || interaction.channel) as TextChannel;

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'يرجى تحديد روم كتابي صالح!')],
        ephemeral: true
      });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null // Reset to default/allow
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم فتح الروم بنجاح 🔓',
            `تم فتح الروم ${channel} والسماح بالكتابة مجدداً.`
          )
        ]
      });

      if (channel.id !== interaction.channelId) {
        await channel.send({
          embeds: [
            createSuccessEmbed('تم فتح هذا الروم 🔓', `تم فتح الروم بواسطة المشرف: ${interaction.user.tag}`)
          ]
        });
      }
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل فتح الروم', 'تأكد من امتلاك البوت لصلاحيات إدارة القنوات.')],
        ephemeral: true
      });
    }
  }
};
