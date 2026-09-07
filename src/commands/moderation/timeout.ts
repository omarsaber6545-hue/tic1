import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { LogService } from '../../services/logService.js';
import { createErrorEmbed, createSuccessEmbed, formatDuration } from '../../utils/arabic.js';

export const timeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تايم-اوت')
    .setDescription('عزل عضو مؤقتاً ومنعه من الكتابة والتفاعل')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد عزله').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('المدة')
        .setDescription('مدة العزل المؤقت')
        .setRequired(true)
        .addChoices(
          { name: 'دقيقة واحدة (60 ثانية)', value: 60 },
          { name: '5 دقائق', value: 300 },
          { name: '10 دقائق', value: 600 },
          { name: 'ساعة واحدة', value: 3600 },
          { name: 'يوم واحد (24 ساعة)', value: 86400 },
          { name: 'أسبوع واحد (7 أيام)', value: 604800 }
        )
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب التايم أوت').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const durationSeconds = interaction.options.getInteger('المدة', true);
    const reason = interaction.options.getString('السبب') || 'لا يوجد سبب محدد';
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'العضو المحدد غير موجود في السيرفر حالياً!')],
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
      await targetMember.timeout(durationSeconds * 1000, `${reason} | بواسطة: ${interaction.user.tag}`);

      await LogService.logModerationAction(interaction.guild, {
        action: 'تايم أوت (Timeout)',
        moderatorTag: interaction.user.tag,
        targetTag: targetUser.tag,
        targetId: targetUser.id,
        reason,
        duration: formatDuration(durationSeconds)
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم تطبيق التايم أوت بنجاح',
            `تم عزل العضو **${targetUser.tag}** مؤقتاً.\n**المدة:** ${formatDuration(durationSeconds)}\n**السبب:** ${reason}`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر تطبيق التايم أوت على هذا العضو.')],
        ephemeral: true
      });
    }
  }
};
