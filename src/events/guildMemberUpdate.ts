import { GuildMember, PartialGuildMember } from 'discord.js';
import { LogService } from '../services/logService.js';
import { createEmbed } from '../utils/arabic.js';
import { COLORS } from '../config/constants.js';

export async function onGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember
): Promise<void> {
  const guild = newMember.guild;

  // 1. Role Changes
  const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
  const removedRoles = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id));

  if (addedRoles.size > 0) {
    const rolesList = addedRoles.map((r) => `${r.name}`).join(' ، ');
    const embed = createEmbed({
      title: '🛡️ إضافة رتب لعضو',
      color: COLORS.SUCCESS,
      timestamp: true
    }).addFields(
      { name: '👤 العضو:', value: `${newMember.user.tag} (${newMember.user})`, inline: true },
      { name: '✨ الرتب المضافة:', value: rolesList, inline: false }
    );
    await LogService.logEvent(guild, 'logRoles', embed);
  }

  if (removedRoles.size > 0) {
    const rolesList = removedRoles.map((r) => `${r.name}`).join(' ، ');
    const embed = createEmbed({
      title: '🛡️ سحب رتب من عضو',
      color: COLORS.WARNING,
      timestamp: true
    }).addFields(
      { name: '👤 العضو:', value: `${newMember.user.tag} (${newMember.user})`, inline: true },
      { name: '❌ الرتب المسحوبة:', value: rolesList, inline: false }
    );
    await LogService.logEvent(guild, 'logRoles', embed);
  }

  // 2. Nickname Change
  if (oldMember.nickname !== newMember.nickname) {
    const embed = createEmbed({
      title: '📝 تغيير الاسم المستعار',
      color: COLORS.INFO,
      timestamp: true
    }).addFields(
      { name: '👤 العضو:', value: `${newMember.user.tag}`, inline: true },
      { name: '◀️ الاسم القديم:', value: oldMember.nickname || oldMember.user.username, inline: true },
      { name: '▶️ الاسم الجديد:', value: newMember.nickname || newMember.user.username, inline: true }
    );
    await LogService.logEvent(guild, 'logServer', embed);
  }
}
