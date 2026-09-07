import { TextChannel, Collection, Message } from 'discord.js';

export async function generateHtmlTranscript(
  channel: TextChannel,
  ticketInfo: {
    ticketNumber: number;
    category: string;
    creatorTag: string;
    closedByTag: string;
  }
): Promise<string> {
  const messages: Message[] = [];
  let lastId: string | undefined;

  // Fetch up to 500 messages
  for (let i = 0; i < 5; i++) {
    const fetched: Collection<string, Message> = await channel.messages.fetch({
      limit: 100,
      before: lastId
    });
    if (fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last()?.id;
    if (fetched.size < 100) break;
  }

  // Reverse so chronological order
  messages.reverse();

  const messagesHtml = messages
    .map((msg) => {
      const authorName = msg.author.username;
      const avatarUrl = msg.author.displayAvatarURL({ size: 64, extension: 'png' });
      const timeStr = msg.createdAt.toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const isBot = msg.author.bot;
      const content = escapeHtml(msg.cleanContent || '');

      let attachmentsHtml = '';
      if (msg.attachments.size > 0) {
        attachmentsHtml = '<div class="attachments">' +
          Array.from(msg.attachments.values())
            .map((att) => {
              if (att.contentType?.startsWith('image/')) {
                return `<div class="attachment-img"><a href="${att.url}" target="_blank"><img src="${att.url}" alt="مرفق صورة" /></a></div>`;
              }
              return `<div class="attachment-file"><a href="${att.url}" target="_blank">📎 ${escapeHtml(att.name)} (${Math.round(att.size / 1024)} KB)</a></div>`;
            })
            .join('') +
          '</div>';
      }

      let embedsHtml = '';
      if (msg.embeds.length > 0) {
        embedsHtml = '<div class="embeds">' +
          msg.embeds
            .map((embed) => {
              const title = embed.title ? `<div class="embed-title">${escapeHtml(embed.title)}</div>` : '';
              const desc = embed.description ? `<div class="embed-desc">${escapeHtml(embed.description)}</div>` : '';
              const color = embed.hexColor || '#5865F2';
              return `<div class="embed" style="border-right-color: ${color};">${title}${desc}</div>`;
            })
            .join('') +
          '</div>';
      }

      return `
      <div class="message">
        <img class="avatar" src="${avatarUrl}" alt="${escapeHtml(authorName)}" />
        <div class="message-body">
          <div class="message-header">
            <span class="author">${escapeHtml(authorName)}</span>
            ${isBot ? '<span class="bot-tag">بوت</span>' : ''}
            <span class="timestamp">${timeStr}</span>
          </div>
          <div class="message-content">${content}</div>
          ${attachmentsHtml}
          ${embedsHtml}
        </div>
      </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>سجل التذكرة #${ticketInfo.ticketNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg-primary: #313338;
      --bg-secondary: #2b2d31;
      --bg-tertiary: #1e1f22;
      --text-normal: #dbdee1;
      --text-muted: #949ba4;
      --header-primary: #f2f3f5;
      --brand: #5865f2;
      --border: #3f4147;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background-color: var(--bg-primary); color: var(--text-normal); direction: rtl; }
    .container { max-width: 900px; margin: 2rem auto; padding: 1.5rem; background-color: var(--bg-secondary); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .ticket-header { border-bottom: 2px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
    .ticket-title { font-size: 1.8rem; font-weight: bold; color: var(--header-primary); margin-bottom: 0.5rem; }
    .ticket-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; color: var(--text-muted); font-size: 0.95rem; }
    .meta-item { background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border); }
    .meta-item strong { color: var(--header-primary); }
    .messages-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .message { display: flex; gap: 1rem; align-items: flex-start; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .message-body { flex-grow: 1; min-width: 0; }
    .message-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
    .author { font-weight: 600; color: var(--header-primary); }
    .bot-tag { background-color: var(--brand); color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .timestamp { font-size: 0.78rem; color: var(--text-muted); }
    .message-content { line-height: 1.5; word-wrap: break-word; white-space: pre-wrap; font-size: 0.98rem; }
    .attachments { margin-top: 0.5rem; }
    .attachment-img img { max-width: 100%; max-height: 350px; border-radius: 8px; margin-top: 0.5rem; }
    .attachment-file a { color: var(--brand); text-decoration: none; font-size: 0.9rem; background: var(--bg-tertiary); padding: 6px 12px; border-radius: 6px; display: inline-block; }
    .embeds { margin-top: 0.5rem; }
    .embed { background: var(--bg-tertiary); border-right: 4px solid var(--brand); padding: 0.75rem 1rem; border-radius: 4px; margin-top: 0.5rem; }
    .embed-title { font-weight: bold; color: var(--header-primary); margin-bottom: 0.25rem; }
    .embed-desc { color: var(--text-normal); font-size: 0.9rem; white-space: pre-wrap; }
    .footer { text-align: center; margin-top: 2rem; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid var(--border); padding-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="ticket-header">
      <div class="ticket-title">📋 سجل تذكرة رقم #${ticketInfo.ticketNumber}</div>
      <div class="ticket-meta">
        <div class="meta-item"><strong>نوع التذكرة:</strong> ${escapeHtml(ticketInfo.category)}</div>
        <div class="meta-item"><strong>صاحب التذكرة:</strong> ${escapeHtml(ticketInfo.creatorTag)}</div>
        <div class="meta-item"><strong>أغلقت بواسطة:</strong> ${escapeHtml(ticketInfo.closedByTag)}</div>
        <div class="meta-item"><strong>عدد الرسائل:</strong> ${messages.length}</div>
      </div>
    </div>
    <div class="messages-container">
      ${messagesHtml}
    </div>
    <div class="footer">
      تم إنشاء هذا السجل تلقائياً عبر نظام ديسكورد العربي الاحترافي • ${new Date().toLocaleDateString('ar-EG')}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
