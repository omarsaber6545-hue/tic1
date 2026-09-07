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

export const kickCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('طرد')
    .setDescription('طرد عضو من السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد طرده').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب الطرد').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
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
      await targetMember.kick(`${reason} | بواسطة: ${interaction.user.tag}`);

      await LogService.logModerationAction(interaction.guild, {
        action: 'طرد عضو (Kick)',
        moderatorTag: interaction.user.tag,
        targetTag: targetUser.tag,
        targetId: targetUser.id,
        reason
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم طرد العضو بنجاح',
            `تم طرد **${targetUser.tag}** (\`${targetUser.id}\`)\n**السبب:** ${reason}`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر طرد هذا العضو. تأكد من رتبة وصلاحيات البوت.')],
        ephemeral: true
      });
    }
  }
};
