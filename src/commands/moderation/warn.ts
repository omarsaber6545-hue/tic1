import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { createErrorEmbed, createSuccessEmbed, createWarningEmbed } from '../../utils/arabic.js';

export const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تحذير')
    .setDescription('إصدار تحذير رسمي لعضو مع فحص التصعيد التلقائي')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد تحذيره').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب التحذير').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const reason = interaction.options.getString('السبب', true);
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'العضو المحدد غير موجود في السيرفر!')],
        ephemeral: true
      });
      return;
    }

    const check = ModerationService.canModerate(executor, targetMember);
    if (!check.allowed) {
      await interaction.reply({
        embeds: [createErrorEmbed('لا يمكن إتمام العملية', check.reason)],
        ephemeral: true
      });
      return;
    }

    try {
      const result = await ModerationService.warnMember(
        interaction.guild,
        targetMember,
        executor,
        reason
      );

      let description = `تم تحذير العضو **${targetUser.tag}** بنجاح.\n**السبب:** ${reason}\n**إجمالي التحذيرات:** ${result.warnCount}`;

      if (result.escalationAction) {
        description += `\n\n🚨 **تم تطبيق عقوبة التصعيد التلقائي:** \`${result.escalationAction}\` لتجاوز الحد الأقصى من التحذيرات!`;
      }

      await interaction.reply({
        embeds: [
          createWarningEmbed('تم إصدار التحذير', description)
        ]
      });

      // Try sending a warning to the member in DM
      await targetUser.send({
        embeds: [
          createWarningEmbed(
            `لقد تلقيت تحذيراً في سيرفر ${interaction.guild.name}`,
            `**السبب:** ${reason}\n**المشرف:** ${interaction.user.tag}\n**إجمالي تحذيراتك الحالية:** ${result.warnCount}`
          )
        ]
      }).catch(() => null);
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر تسجيل التحذير في قاعدة البيانات.')],
        ephemeral: true
      });
    }
  }
};
