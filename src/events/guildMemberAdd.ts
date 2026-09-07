import { GuildMember } from 'discord.js';
import { WelcomeService } from '../services/welcomeService.js';
import { LogService } from '../services/logService.js';
import { createEmbed, formatNumber } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  // 1. Process Welcome features (Auto-role, DM, Welcome Message)
  await WelcomeService.handleMemberJoin(member);

  // 2. Audit Log for member join
  const embed = createEmbed({
    title: '📥 انضمام عضو جديد للسيرفر',
    color: COLORS.SUCCESS,
    timestamp: true
  })
    .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: '👤 العضو:', value: `${member.user.tag} (${member.user})`, inline: true },
      { name: '🆔 المعرف:', value: `\`${member.id}\``, inline: true },
      { name: '👥 عدد الأعضاء الحالي:', value: `${formatNumber(member.guild.memberCount)} عضو`, inline: true },
      { name: '📅 إنشاء الحساب:', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
    );

  await LogService.logEvent(member.guild, 'logJoinLeave', embed);
}
