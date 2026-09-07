import { DMChannel, NonThreadGuildBasedChannel } from 'discord.js';
import { LogService } from '../services/logService.js';
import { createEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export async function onChannelCreate(channel: NonThreadGuildBasedChannel): Promise<void> {
  const embed = createEmbed({
    title: '📁 إنشاء قناة جديدة',
    color: COLORS.SUCCESS,
    timestamp: true
  }).addFields(
    { name: '🏷️ اسم القناة:', value: `#${channel.name}`, inline: true },
    { name: '🆔 المعرف:', value: `\`${channel.id}\``, inline: true },
    { name: '📂 نوع القناة:', value: `${channel.type}`, inline: true }
  );

  await LogService.logEvent(channel.guild, 'logChannels', embed);
}

export async function onChannelDelete(channel: DMChannel | NonThreadGuildBasedChannel): Promise<void> {
  if (!('guild' in channel)) return;

  const embed = createEmbed({
    title: '🗑️ حذف قناة',
    color: COLORS.DANGER,
    timestamp: true
  }).addFields(
    { name: '🏷️ اسم القناة المحذوفة:', value: `#${channel.name}`, inline: true },
    { name: '🆔 المعرف:', value: `\`${channel.id}\``, inline: true }
  );

  await LogService.logEvent(channel.guild, 'logChannels', embed);
}
