import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types/command.js';
import { EconomyService } from '../../services/economyService.js';
import { createEmbed } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const inventoryCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('حقيبتي')
    .setDescription('عرض حقيبة مقتنياتك ومشترياتك السابقة من المتجر'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const inventory = await EconomyService.getInventory(interaction.guild.id, interaction.user.id);

    if (inventory.length === 0) {
      await interaction.reply({
        embeds: [
          createEmbed({
            title: `🎒 حقيبة مقتنيات: ${interaction.user.username}`,
            description: 'حقيبتك فارغة تماماً! يمكنك زيارة `/المتجر` لشراء منتجات ورتب حصرية.',
            color: COLORS.DARK
          })
        ]
      });
      return;
    }

    const embed = createEmbed({
      title: `🎒 حقيبة مقتنيات: ${interaction.user.username} (${inventory.length} عناصر)`,
      color: COLORS.PRIMARY
    });

    inventory.forEach((inv) => {
      const dateStr = `<t:${Math.floor(inv.boughtAt.getTime() / 1000)}:d>`;
      embed.addFields({
        name: `📦 ${inv.item.name} (الكمية: ${inv.quantity})`,
        value: `${inv.item.description}\nتاريخ الشراء: ${dateStr}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
