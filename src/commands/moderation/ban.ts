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

export const banCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('حظر')
    .setDescription('حظر عضو من السيرفر نهائياً مع تحديد السبب')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد حظره').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب الحظر').setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('حذف-الرسائل')
        .setDescription('حذف رسائل العضو لعدد محدد من الأيام')
        .setRequired(false)
        .addChoices(
          { name: 'عدم الحذف', value: 0 },
          { name: 'آخر 24 ساعة', value: 1 },
          { name: 'آخر 7 أيام', value: 7 }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const reason = interaction.options.getString('السبب') || 'لا يوجد سبب محدد';
    const deleteDays = interaction.options.getInteger('حذف-الرسائل') || 0;

    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const check = ModerationService.canModerate(executor, targetMember);
      if (!check.allowed) {
        await interaction.reply({
          embeds: [createErrorEmbed('لا يمكن إتمام العملية', check.reason)],
          ephemeral: true
        });
        return;
      }
    }

    try {
      await interaction.guild.bans.create(targetUser.id, {
        reason: `${reason} | بواسطة: ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60
      });

      await LogService.logModerationAction(interaction.guild, {
        action: 'حظر عضو (Ban)',
        moderatorTag: interaction.user.tag,
        targetTag: targetUser.tag,
        targetId: targetUser.id,
        reason
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم حظر العضو بنجاح',
            `تم حظر **${targetUser.tag}** (\`${targetUser.id}\`)\n**السبب:** ${reason}`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر حظر هذا العضو. تأكد من رتبة وصلاحيات البوت.')],
        ephemeral: true
      });
    }
  }
};
