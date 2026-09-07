import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
  Role
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LogService } from '../../services/logService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const removeRoleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('إزالة-رتبة')
    .setDescription('سحب رتبة من عضو في السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد سحب الرتبة منه').setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName('الرتبة').setDescription('الرتبة المراد سحبها').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const role = interaction.options.getRole('الرتبة', true) as Role;
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'العضو غير موجود في السيرفر!')],
        ephemeral: true
      });
      return;
    }

    if (
      executor.id !== interaction.guild.ownerId &&
      role.position >= executor.roles.highest.position
    ) {
      await interaction.reply({
        embeds: [createErrorEmbed('صلاحيات غير كافية', 'لا يمكنك سحب رتبة أعلى من رتبتك أو مساوية لها!')],
        ephemeral: true
      });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (botMember && role.position >= botMember.roles.highest.position) {
      await interaction.reply({
        embeds: [createErrorEmbed('صلاحيات غير كافية', 'رتبة البوت أدنى من هذه الرتبة ولا يستطيع سحبها!')],
        ephemeral: true
      });
      return;
    }

    if (!targetMember.roles.cache.has(role.id)) {
      await interaction.reply({
        embeds: [createErrorEmbed('تنبيه', `العضو لا يمتلك رتبة ${role} أصلاً!`)],
        ephemeral: true
      });
      return;
    }

    try {
      await targetMember.roles.remove(role, `بواسطة المشرف: ${interaction.user.tag}`);

      await LogService.logModerationAction(interaction.guild, {
        action: 'إزالة رتبة',
        moderatorTag: interaction.user.tag,
        targetTag: targetUser.tag,
        targetId: targetUser.id,
        reason: `سحب رتبة ${role.name}`
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم سحب الرتبة بنجاح',
            `تم سحب رتبة ${role} من العضو **${targetUser.tag}**.`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل سحب الرتبة', 'حدث خطأ أثناء محاولة سحب الرتبة.')],
        ephemeral: true
      });
    }
  }
};
