import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { Command } from '../../types/command.js';
import { createEmbed, createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const ticketPanelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('لوحة-التذاكر')
    .setDescription('إرسال لوحة فتح التذاكر التفاعلية إلى روم مخصص')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName('الروم').setDescription('الروم المراد إرسال اللوحة إليه (افتراضياً الروم الحالي)').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('العنوان').setDescription('عنوان لوحة التذاكر المخصص').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('الوصف').setDescription('نص الوصف والتعليمات داخل اللوحة').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = (interaction.options.getChannel('الروم') || interaction.channel) as TextChannel;
    const title = interaction.options.getString('العنوان') || '🎫 نظام التذاكر والمساعدة';
    const description =
      interaction.options.getString('الوصف') ||
      'مرحباً بك في قسم الدعم وخدمة الأعضاء!\n\n' +
      'لفتح تذكرة جديدة والتواصل مع الإدارة أو فريق الدعم، اضغط على الزر أدناه ثم اختر القسم المناسب لموضوعك.\n\n' +
      '⚠️ يرجى عدم فتح تذاكر عشوائية أو مكررة تفادياً للمساءلة.';

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'يرجى اختيار روم كتابي صالح!')],
        ephemeral: true
      });
      return;
    }

    const embed = createEmbed({
      title,
      description,
      color: COLORS.PRIMARY
    })
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setFooter({ text: `${interaction.guild.name} • Horizon Services` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open_menu')
        .setLabel('فتح تذكرة')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    try {
      await channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم إرسال لوحة التذاكر بنجاح',
            `تم نشر لوحة فتح التذاكر في الروم ${channel}.`
          )
        ],
        ephemeral: true
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل إرسال اللوحة', 'تأكد من صلاحيات البوت في الروم المحدد.')],
        ephemeral: true
      });
    }
  }
};
