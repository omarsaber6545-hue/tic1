import { Message, PartialMessage } from 'discord.js';
import { LogService } from '../services/logService.js';
import { createEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export async function onMessageDelete(message: Message | PartialMessage): Promise<void> {
  if (!message.guild || message.author?.bot) return;

  const embed = createEmbed({
    title: '🗑️ حذف رسالة',
    color: COLORS.DANGER,
    timestamp: true
  }).addFields(
    { name: '👤 صاحب الرسالة:', value: message.author ? `${message.author.tag} (\`${message.author.id}\`)` : 'غير معروف', inline: true },
    { name: '📍 الروم:', value: `${message.channel}`, inline: true },
    { name: '📄 محتوى الرسالة المحذوفة:', value: message.content ? (message.content.length > 1024 ? message.content.slice(0, 1021) + '...' : message.content) : '*(لا يوجد نص أو رسالة تحتوي على وسائط فقط)*', inline: false }
  );

  if (message.attachments && message.attachments.size > 0) {
    embed.addFields({
      name: '📎 المرفقات:',
      value: `${message.attachments.size} ملف مرفق`,
      inline: true
    });
  }

  await LogService.logEvent(message.guild, 'logMessages', embed);
}
