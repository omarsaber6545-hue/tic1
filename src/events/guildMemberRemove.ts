import { GuildMember, PartialGuildMember } from 'discord.js';
import { LogService } from '../services/logService.js';
import { createEmbed, formatNumber } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
  const embed = createEmbed({
    title: '📤 مغادرة عضو من السيرفر',
    color: COLORS.DANGER,
    timestamp: true
  })
    .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: '👤 العضو:', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
      { name: '👥 عدد الأعضاء المتبقي:', value: `${formatNumber(member.guild.memberCount)} عضو`, inline: true }
    );

  await LogService.logEvent(member.guild, 'logJoinLeave', embed);
}
