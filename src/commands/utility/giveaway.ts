import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel
} from 'discord.js';
import { Command } from '../../types/command.js';
import { GiveawayService } from '../../services/giveawayService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const giveawayCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('مسابقة')
    .setDescription('إدارة ونشر وسحب المسابقات والجوائز')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('إنشاء')
        .setDescription('بدء مسابقة وسحب جديد')
        .addStringOption((opt) =>
          opt.setName('الجائزة').setDescription('الجائزة المقدمة في المسابقة').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('المدة-بالدقائق').setDescription('مدة المسابقة بالدقائق').setMinValue(1).setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('عدد-الفائزين').setDescription('عدد الفائزين المحتملين').setMinValue(1).setMaxValue(20).setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName('رتبة-مطلوبة').setDescription('رتبة مطلوبة للدخول بالمسابقة').setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt.setName('نقاط-مطلوبة').setDescription('عدد نقاط مطلوب في الرصيد للدخول').setMinValue(0).setRequired(false)
        )
        .addChannelOption((opt) =>
          opt.setName('الروم').setDescription('الروم المراد نشر المسابقة فيه').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('إنهاء')
        .setDescription('إنهاء مسابقة جارية فوراً وسحب الفائزين')
        .addStringOption((opt) =>
          opt.setName('معرف-الرسالة').setDescription('معرف رسالة المسابقة (Message ID)').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('إعادة-اختيار')
        .setDescription('إعادة سحب واختيار فائز جديد لمسابقة منتهية')
        .addStringOption((opt) =>
          opt.setName('معرف-الرسالة').setDescription('معرف رسالة المسابقة (Message ID)').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();
    const member = interaction.member as GuildMember;

    if (sub === 'إنشاء') {
      const prize = interaction.options.getString('الجائزة', true);
      const minutes = interaction.options.getInteger('المدة-بالدقائق', true);
      const winnersCount = interaction.options.getInteger('عدد-الفائزين') || 1;
      const role = interaction.options.getRole('رتبة-مطلوبة');
      const points = interaction.options.getInteger('نقاط-مطلوبة') || 0;
      const channel = (interaction.options.getChannel('الروم') || interaction.channel) as TextChannel;

      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          embeds: [createErrorEmbed('خطأ', 'يرجى اختيار روم كتابي صالح!')],
          ephemeral: true
        });
        return;
      }

      const result = await GiveawayService.createGiveaway(interaction.guild, channel, member, {
        prize,
        durationSeconds: minutes * 60,
        winnersCount,
        requiredRoleId: role?.id,
        requiredPoints: points
      });

      await interaction.reply({
        embeds: [createSuccessEmbed('تم إنشاء المسابقة', result.message)],
        ephemeral: true
      });
    } else if (sub === 'إنهاء') {
      const messageId = interaction.options.getString('معرف-الرسالة', true);
      const result = await GiveawayService.endGiveaway(interaction.client, messageId);

      if (!result.success) {
        await interaction.reply({
          embeds: [createErrorEmbed('فشل إنهاء المسابقة', result.message || 'خطأ غير معروف')],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [createSuccessEmbed('تم إنهاء المسابقة بنجاح', 'تم سحب الفائزين وإعلان النتائج.')],
        ephemeral: true
      });
    } else if (sub === 'إعادة-اختيار') {
      const messageId = interaction.options.getString('معرف-الرسالة', true);
      const result = await GiveawayService.rerollGiveaway(interaction.client, messageId);

      if (!result.success) {
        await interaction.reply({
          embeds: [createErrorEmbed('فشل إعادة السحب', result.message || 'خطأ')],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تمت إعادة السحب بنجاح 🎉',
            `الفائز الجديد هو: <@${result.newWinner}>!`
          )
        ],
        ephemeral: true
      });
    }
  }
};
