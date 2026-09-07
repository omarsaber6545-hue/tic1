import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { EconomyService } from '../../services/economyService.js';
import { createEmbed, formatNumber } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const shopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('المتجر')
    .setDescription('عرض قائمة المنتجات والرتب المتاحة للشراء في متجر السيرفر'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const items = await EconomyService.getShopItems(interaction.guild.id);
    const balanceInfo = await EconomyService.getMemberBalance(interaction.guild.id, interaction.user.id);

    if (items.length === 0) {
      await interaction.reply({
        embeds: [
          createEmbed({
            title: `🛒 متجر سيرفر: ${interaction.guild.name}`,
            description: 'المتجر فارغ حالياً! يمكن للإدارة إضافة منتجات ورتب من خلال لوحة التحكم (Dashboard).',
            color: COLORS.DARK
          })
        ]
      });
      return;
    }

    const embed = createEmbed({
      title: `🛒 متجر سيرفر: ${interaction.guild.name}`,
      description: `رصيدك الحالي في المحفظة: **${formatNumber(balanceInfo.balance)}** ${balanceInfo.currencySymbol}\n\nللشراء استخدم الأمر: \`/شراء [رقم_المنتج]\`\n`,
      color: COLORS.INFO
    });

    items.forEach((item) => {
      const stockText = item.stock === -1 ? 'غير محدود' : `${item.stock} متبقي`;
      const roleText = item.roleId ? `• رتبة: <@&${item.roleId}>` : '';

      embed.addFields({
        name: `📦 #${item.id} - ${item.name} (${formatNumber(item.price)} ${balanceInfo.currencySymbol})`,
        value: `${item.description}\nالكمية: **${stockText}** ${roleText}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
