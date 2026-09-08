import { TextChannel, Collection, Message } from 'discord.js';

export async function generateHtmlTranscript(
  channel: TextChannel,
  ticketInfo: {
    ticketNumber: number;
    category: string;
    creatorTag: string;
    closedByTag: string;
    reason?: string;
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
        attachmentsHtml =
          '<div class="attachments">' +
          Array.from(msg.attachments.values())
            .map((att) => {
              if (att.contentType?.startsWith('image/')) {
                return `<div class="attachment-img"><a href="${att.url}" target="_blank" rel="noopener noreferrer"><img src="${att.url}" alt="مرفق صورة" loading="lazy" /></a></div>`;
              }
              return `<div class="attachment-file"><a href="${att.url}" target="_blank" rel="noopener noreferrer">📎 ${escapeHtml(att.name)} (${Math.round(att.size / 1024)} KB)</a></div>`;
            })
            .join('') +
          '</div>';
      }

      let embedsHtml = '';
      if (msg.embeds.length > 0) {
        embedsHtml =
          '<div class="embeds">' +
          msg.embeds
            .map((embed) => {
              const title = embed.title ? `<div class="embed-title">${escapeHtml(embed.title)}</div>` : '';
              const desc = embed.description ? `<div class="embed-desc">${escapeHtml(embed.description)}</div>` : '';
              const color = embed.hexColor || '#5865F2';
              return `<div class="embed" style="border-right-color: ${color};"><div class="embed-color-bar" style="background: ${color};"></div><div class="embed-inner">${title}${desc}</div></div>`;
            })
            .join('') +
          '</div>';
      }

      return `
      <div class="message ${isBot ? 'is-bot' : ''}">
        <img class="avatar" src="${avatarUrl}" alt="${escapeHtml(authorName)}" loading="lazy" />
        <div class="message-body">
          <div class="message-header">
            <span class="author">${escapeHtml(authorName)}</span>
            ${isBot ? '<span class="bot-tag">بوت رسمي</span>' : ''}
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
  <title>سجل تذكرة #${ticketInfo.ticketNumber} • Horizon Services</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-body: #0f1117;
      --bg-card: rgba(22, 27, 34, 0.85);
      --bg-surface: #1e222d;
      --bg-hover: #262c3a;
      --brand: #5865f2;
      --brand-glow: rgba(88, 101, 242, 0.25);
      --accent-green: #57f287;
      --accent-gold: #f1c40f;
      --text-main: #f0f3f6;
      --text-muted: #8b949e;
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(88, 101, 242, 0.4);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; }
    body {
      background-color: var(--bg-body);
      background-image: radial-gradient(circle at top right, rgba(88, 101, 242, 0.12), transparent 400px),
                        radial-gradient(circle at bottom left, rgba(87, 242, 135, 0.05), transparent 400px);
      color: var(--text-main);
      direction: rtl;
      padding: 2rem 1rem;
      min-height: 100vh;
    }
    .container {
      max-width: 950px;
      margin: 0 auto;
      background-color: var(--bg-card);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 18px;
      border: 1px solid var(--border);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }
    .header-banner {
      background: linear-gradient(135deg, #1c2130, #131722);
      border-bottom: 1px solid var(--border);
      padding: 2rem 2.5rem;
      position: relative;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(88, 101, 242, 0.15);
      color: var(--brand);
      border: 1px solid var(--border-accent);
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .ticket-title {
      font-size: 2rem;
      font-weight: 900;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .ticket-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .meta-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.85rem 1.1rem;
      transition: all 0.2s ease;
    }
    .meta-box:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-accent);
      transform: translateY(-1px);
    }
    .meta-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .meta-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .messages-container {
      padding: 2rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .message {
      display: flex;
      gap: 1.1rem;
      align-items: flex-start;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      transition: background 0.15s ease;
    }
    .message:hover {
      background: rgba(255, 255, 255, 0.025);
    }
    .message.is-bot {
      background: rgba(88, 101, 242, 0.04);
      border-right: 3px solid var(--brand);
    }
    .avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .message-body {
      flex-grow: 1;
      min-width: 0;
    }
    .message-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.35rem;
    }
    .author {
      font-weight: 700;
      color: #fff;
      font-size: 0.95rem;
    }
    .bot-tag {
      background: var(--brand);
      color: #fff;
      font-size: 0.7rem;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .timestamp {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .message-content {
      line-height: 1.65;
      word-wrap: break-word;
      white-space: pre-wrap;
      font-size: 0.95rem;
      color: #d1d7e0;
    }
    .attachments { margin-top: 0.75rem; }
    .attachment-img img {
      max-width: 100%;
      max-height: 420px;
      border-radius: 10px;
      margin-top: 0.5rem;
      border: 1px solid var(--border);
    }
    .attachment-file a {
      color: var(--brand);
      text-decoration: none;
      font-size: 0.88rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      padding: 7px 14px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .attachment-file a:hover {
      background: var(--bg-hover);
      border-color: var(--brand);
    }
    .embeds { margin-top: 0.75rem; }
    .embed {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-right: 4px solid var(--brand);
      padding: 1rem 1.25rem;
      border-radius: 10px;
      margin-top: 0.5rem;
    }
    .embed-title { font-weight: 800; color: #fff; margin-bottom: 0.4rem; font-size: 1rem; }
    .embed-desc { color: var(--text-muted); font-size: 0.9rem; white-space: pre-wrap; line-height: 1.5; }
    .footer {
      text-align: center;
      background: #12151d;
      color: var(--text-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      padding: 1.5rem;
      font-weight: 600;
    }
    .footer strong { color: var(--brand); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-banner">
      <div class="header-badge">✦ HORIZON SERVICES • نـظـام الـتـذاكـر الـمـوثـق ✦</div>
      <div class="ticket-title">📋 سجل تذكرة رقم #${ticketInfo.ticketNumber}</div>
      <div class="ticket-meta-grid">
        <div class="meta-box">
          <div class="meta-label">🏷️ نوع التذكرة والقسم</div>
          <div class="meta-value">${escapeHtml(ticketInfo.category)}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">👤 صاحب التذكرة</div>
          <div class="meta-value">${escapeHtml(ticketInfo.creatorTag)}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">🔒 أغلقت بواسطة</div>
          <div class="meta-value">${escapeHtml(ticketInfo.closedByTag)}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">📝 سبب الإغلاق</div>
          <div class="meta-value">${escapeHtml(ticketInfo.reason || 'تم الانتهاء وحل المشكلة')}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">💬 إجمالي الرسائل</div>
          <div class="meta-value">${messages.length} رسالة</div>
        </div>
      </div>
    </div>

    <div class="messages-container">
      ${messagesHtml}
    </div>

    <div class="footer">
      تم إنشاء وأرشفة هذا السجل تلقائياً عبر نظام <strong>Horizon Services</strong> • جميع الحقوق محفوظة © ${new Date().getFullYear()}
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
