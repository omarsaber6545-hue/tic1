import { Message, PartialMessage } from 'discord.js';
import { LogService } from '../services/logService.js';
import { createEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export async function onMessageUpdate(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
): Promise<void> {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return; // Ignore link embed updates

  const embed = createEmbed({
    title: '✏️ تعديل رسالة',
    color: COLORS.INFO,
    timestamp: true
  }).addFields(
    { name: '👤 صاحب الرسالة:', value: newMessage.author ? `${newMessage.author.tag} (\`${newMessage.author.id}\`)` : 'غير معروف', inline: true },
    { name: '📍 الروم:', value: `${newMessage.channel}`, inline: true },
    { name: '🔗 رابط الرسالة:', value: `[انتقل إلى الرسالة](${newMessage.url})`, inline: true },
    {
      name: '◀️ النص القديم:',
      value: oldMessage.content ? (oldMessage.content.length > 1024 ? oldMessage.content.slice(0, 1021) + '...' : oldMessage.content) : '*(غير متوفر)*',
      inline: false
    },
    {
      name: '▶️ النص الجديد المعدل:',
      value: newMessage.content ? (newMessage.content.length > 1024 ? newMessage.content.slice(0, 1021) + '...' : newMessage.content) : '*(غير متوفر)*',
      inline: false
    }
  );

  await LogService.logEvent(newMessage.guild, 'logMessages', embed);
}
