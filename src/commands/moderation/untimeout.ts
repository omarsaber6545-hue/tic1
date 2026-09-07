import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { LogService } from '../../services/logService.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/arabic.js';

export const untimeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('إزالة-التايم-اوت')
    .setDescription('فك العزل المؤقت عن عضو وإعادة صلاحية الكتابة له')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد إزالة العزل عنه').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب إزالة التايم أوت').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const reason = interaction.options.getString('السبب') || 'لا يوجد سبب محدد';
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
      await targetMember.timeout(null, `${reason} | بواسطة: ${interaction.user.tag}`);

      await LogService.logModerationAction(interaction.guild, {
        action: 'إزالة التايم أوت',
        moderatorTag: interaction.user.tag,
        targetTag: targetUser.tag,
        targetId: targetUser.id,
        reason
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم إلغاء التايم أوت بنجاح',
            `تم رفع العزل المؤقت عن العضو **${targetUser.tag}**.\n**السبب:** ${reason}`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر إزالة التايم أوت عن هذا العضو.')],
        ephemeral: true
      });
    }
  }
};
