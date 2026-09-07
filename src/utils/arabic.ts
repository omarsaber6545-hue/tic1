import { EmbedBuilder, User, GuildMember } from 'discord.js';
import { COLORS } from '../config/constants.js';

export function createEmbed(options?: {
  title?: string;
  description?: string;
  color?: number;
  footer?: string;
  timestamp?: boolean;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(options?.color ?? COLORS.PRIMARY);

  if (options?.title) embed.setTitle(options.title);
  if (options?.description) embed.setDescription(options.description);
  if (options?.footer) {
    embed.setFooter({ text: options.footer });
  } else {
    embed.setFooter({ text: 'Horizon Services • جميع الحقوق محفوظة' });
  }
  if (options?.timestamp !== false) {
    embed.setTimestamp();
  }

  return embed;
}

export function createSuccessEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed({
    title: `✅ ${title}`,
    description,
    color: COLORS.SUCCESS
  });
}

export function createErrorEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed({
    title: `❌ ${title}`,
    description,
    color: COLORS.DANGER
  });
}

export function createWarningEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed({
    title: `⚠️ ${title}`,
    description,
    color: COLORS.WARNING
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} ثانية`);

  return parts.join(' و ');
}

export function getUserDisplayName(user: User | GuildMember): string {
  if (user instanceof GuildMember) {
    return user.displayName;
  }
  return user.globalName || user.username;
}
