import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel
} from 'discord.js';
import { Command } from '../../types/command.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const lockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('قفل')
    .setDescription('قفل الروم ومنع الأعضاء من إرسال الرسائل')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option.setName('الروم').setDescription('الروم المراد قفله (افتراضياً الروم الحالي)').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب قفل الروم').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = (interaction.options.getChannel('الروم') || interaction.channel) as TextChannel;
    const reason = interaction.options.getString('السبب') || 'لا يوجد سبب محدد';

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'يرجى تحديد روم كتابي صالح!')],
        ephemeral: true
      });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم قفل الروم بنجاح 🔒',
            `تم قفل الروم ${channel} ومنع إرسال الرسائل.\n**السبب:** ${reason}`
          )
        ]
      });

      if (channel.id !== interaction.channelId) {
        await channel.send({
          embeds: [
            createSuccessEmbed(
              'تم قفل هذا الروم 🔒',
              `تم قفل الروم بواسطة المشرف: ${interaction.user.tag}\n**السبب:** ${reason}`
            )
          ]
        });
      }
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل قفل الروم', 'تأكد من امتلاك البوت لصلاحيات إدارة القنوات والرتب.')],
        ephemeral: true
      });
    }
  }
};
