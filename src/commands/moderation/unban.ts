import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { LogService } from '../../services/logService.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/arabic.js';

export const unbanCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('فك-الحظر')
    .setDescription('إلغاء حظر عضو من السيرفر باستخدام المعرف (User ID)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option.setName('المعرف').setDescription('معرف العضو (ID)').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('السبب').setDescription('سبب فك الحظر').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const userId = interaction.options.getString('المعرف', true);
    const reason = interaction.options.getString('السبب') || 'لا يوجد سبب محدد';

    try {
      const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) {
        await interaction.reply({
          embeds: [createErrorEmbed('العضو غير محظور', 'لم يتم العثور على حظر لهذا المعرف في السيرفر.')],
          ephemeral: true
        });
        return;
      }

      await interaction.guild.bans.remove(userId, `${reason} | بواسطة: ${interaction.user.tag}`);

      await LogService.logModerationAction(interaction.guild, {
        action: 'فك الحظر (Unban)',
        moderatorTag: interaction.user.tag,
        targetTag: banInfo.user.tag,
        targetId: userId,
        reason
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم إلغاء الحظر بنجاح',
            `تم فك الحظر عن العضو **${banInfo.user.tag}** (\`${userId}\`)\n**السبب:** ${reason}`
          )
        ]
      });
    } catch (err) {
      await interaction.reply({
        embeds: [createErrorEmbed('فشل تنفيذ الأمر', 'تعذر إلغاء حظر هذا المعرف.')],
        ephemeral: true
      });
    }
  }
};
