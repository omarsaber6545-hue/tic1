import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember
} from 'discord.js';
import { Command } from '../../types/command.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';

export const setnameCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('تغيير-الاسم')
    .setDescription('تغيير الاسم المستعار لعضو داخل السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((option) =>
      option.setName('العضو').setDescription('العضو المراد تغيير اسمه').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('الاسم-الجديد').setDescription('الاسم المستعار الجديد (اتركه فارغاً لإعادة التعيين)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser('العضو', true);
    const newNick = interaction.options.getString('الاسم-الجديد');
    const executor = interaction.member as GuildMember;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'العضو غير موجود في السيرفر!')],
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
      await targetMember.setNickname(newNick || null);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم تعديل الاسم المستعار بنجاح',
            newNick
              ? `تم تغيير اسم العضو **${targetUser.tag}** إلى: **${newNick}**`
              : `تمت إعادة تعيين الاسم المستعار الأصلي للعضو **${targetUser.tag}**`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تعديل الاسم', 'تأكد من أن رتبة البوت أعلى من رتبة العضو.')],
        ephemeral: true
      });
    }
  }
};
