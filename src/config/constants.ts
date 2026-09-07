export const COLORS = {
  PRIMARY: 0x5865F2,   // Discord Blurple
  SUCCESS: 0x57F287,   // Green
  WARNING: 0xFEE75C,   // Yellow
  DANGER: 0xED4245,    // Red
  INFO: 0x3498DB,      // Blue
  DARK: 0x2B2D31,      // Discord Dark
  GOLD: 0xF1C40F,      // Gold for Leaderboards
  PURPLE: 0x9B59B6     // Purple for Giveaways
};

export const TICKET_CATEGORIES = [
  {
    id: 'TECHNICAL',
    label: 'الدعم الفني',
    description: 'مساعدة ومشاكل تقنية داخل السيرفر',
    emoji: '🛠️'
  },
  {
    id: 'PURCHASE',
    label: 'المشتريات',
    description: 'شراء رتب، خدمات، أو منتجات السيرفر',
    emoji: '🛒'
  },
  {
    id: 'PAYMENT',
    label: 'الدفع والفوترة',
    description: 'استفسارات ومشاكل التحويل والدفع',
    emoji: '💰'
  },
  {
    id: 'REPORT',
    label: 'الإبلاغ والشكاوى',
    description: 'الإبلاغ عن مخالفة عضو أو إساءة استخدام',
    emoji: '🚨'
  },
  {
    id: 'PARTNERSHIP',
    label: 'الشراكات والإعلانات',
    description: 'عقد شراكة أو تبادل إعلاني مع السيرفر',
    emoji: '🤝'
  },
  {
    id: 'OTHER',
    label: 'استفسار آخر',
    description: 'أي سؤال أو استفسار عام آخر',
    emoji: '❓'
  }
];

export const PERMISSION_TRANSLATIONS: Record<string, string> = {
  Administrator: 'مسؤول (Administrator)',
  ManageGuild: 'إدارة السيرفر',
  ManageRoles: 'إدارة الرتب',
  ManageChannels: 'إدارة القنوات',
  KickMembers: 'طرد الأعضاء',
  BanMembers: 'حظر الأعضاء',
  ManageMessages: 'إدارة الرسائل',
  ModerateMembers: 'عزل الأعضاء (Timeout)',
  ViewAuditLog: 'عرض سجل العمليات',
  SendMessages: 'إرسال الرسائل',
  EmbedLinks: 'تضمين الروابط',
  AttachFiles: 'إرفاق الملفات'
};
