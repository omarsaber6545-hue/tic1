import { AttachmentBuilder } from 'discord.js';

export interface RankCardData {
  username: string;
  avatarUrl: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  points: number;
  rank: number;
}

export function generateRankCardSvg(data: RankCardData): Buffer {
  const percentage = Math.min(100, Math.max(0, Math.round((data.currentXp / data.requiredXp) * 100)));
  const progressWidth = Math.round((percentage / 100) * 580);

  const svg = `
<svg width="800" height="240" viewBox="0 0 800 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141824"/>
      <stop offset="50%" stop-color="#1e2433"/>
      <stop offset="100%" stop-color="#0f111a"/>
    </linearGradient>

    <!-- Glass Overlay -->
    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>

    <!-- Progress Bar Gradient -->
    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>

    <!-- Clip Avatar -->
    <clipPath id="avatarClip">
      <circle cx="110" cy="120" r="60"/>
    </clipPath>
  </defs>

  <!-- Outer Card Background with Rounded Corners and Shadow -->
  <rect x="10" y="10" width="780" height="220" rx="20" fill="url(#bgGradient)" stroke="#2e384d" stroke-width="1.5" />
  <rect x="10" y="10" width="780" height="220" rx="20" fill="url(#glassGradient)" />

  <!-- Avatar Ring / Glow -->
  <circle cx="110" cy="120" r="64" fill="none" stroke="#6366f1" stroke-width="4" opacity="0.8" />

  <!-- Avatar Image -->
  <image href="${escapeXml(data.avatarUrl)}" x="50" y="60" width="120" height="120" clip-path="url(#avatarClip)" />

  <!-- Username and Discriminator (Arabic RTL / Align right-to-left) -->
  <text x="740" y="65" text-anchor="end" font-family="'Segoe UI', Tajawal, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">
    ${escapeXml(data.username)}
  </text>

  <!-- Rank and Level Stats -->
  <g text-anchor="start" font-family="'Segoe UI', Tajawal, sans-serif">
    <!-- Rank Badge -->
    <text x="190" y="65" font-size="14" font-weight="600" fill="#94a3b8">الترتيب:</text>
    <text x="245" y="65" font-size="22" font-weight="bold" fill="#38bdf8">#${data.rank}</text>

    <!-- Level Badge -->
    <text x="320" y="65" font-size="14" font-weight="600" fill="#94a3b8">المستوى:</text>
    <text x="385" y="65" font-size="22" font-weight="bold" fill="#a855f7">${data.level}</text>

    <!-- Points Badge -->
    <text x="460" y="65" font-size="14" font-weight="600" fill="#94a3b8">النقاط:</text>
    <text x="510" y="65" font-size="22" font-weight="bold" fill="#fbbf24">${data.points}</text>
  </g>

  <!-- XP Details Text -->
  <text x="740" y="130" text-anchor="end" font-family="'Segoe UI', sans-serif" font-size="15" fill="#cbd5e1">
    <tspan font-weight="bold" fill="#38bdf8">${data.currentXp}</tspan>
    <tspan fill="#64748b"> / </tspan>
    <tspan fill="#94a3b8">${data.requiredXp} XP</tspan>
    <tspan fill="#64748b"> (${percentage}%)</tspan>
  </text>

  <!-- Progress Bar Container Track -->
  <rect x="190" y="145" width="550" height="24" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>

  <!-- Progress Fill -->
  ${
    progressWidth > 0
      ? `<rect x="190" y="145" width="${Math.min(550, progressWidth)}" height="24" rx="12" fill="url(#progressGradient)" />`
      : ''
  }

  <!-- Footer Tagline -->
  <text x="465" y="202" text-anchor="middle" font-family="'Segoe UI', Tajawal, sans-serif" font-size="12" fill="#64748b">
    Horizon Services • تفاعل أكثر لترتقي برتبتك ومستواك! 🚀
  </text>
</svg>
`;

  return Buffer.from(svg, 'utf-8');
}

export function createRankCardAttachment(data: RankCardData): AttachmentBuilder {
  const buffer = generateRankCardSvg(data);
  return new AttachmentBuilder(buffer, { name: 'rank-card.svg' });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
