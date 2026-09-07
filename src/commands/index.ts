import { Command } from '../types/command.js';

// Admin
import { ticketPanelCommand } from './admin/ticketPanel.js';

// Moderation
import { banCommand } from './moderation/ban.js';
import { unbanCommand } from './moderation/unban.js';
import { kickCommand } from './moderation/kick.js';
import { timeoutCommand } from './moderation/timeout.js';
import { untimeoutCommand } from './moderation/untimeout.js';
import { warnCommand } from './moderation/warn.js';
import { warningsCommand } from './moderation/warnings.js';
import { removeWarnCommand } from './moderation/removeWarn.js';
import { clearWarnsCommand } from './moderation/clearWarns.js';
import { clearCommand } from './moderation/clear.js';
import { lockCommand } from './moderation/lock.js';
import { unlockCommand } from './moderation/unlock.js';
import { slowmodeCommand } from './moderation/slowmode.js';
import { setnameCommand } from './moderation/setname.js';
import { addRoleCommand } from './moderation/addRole.js';
import { removeRoleCommand } from './moderation/removeRole.js';

// Points & Levels
import { pointsCommand } from './points/points.js';
import { rankCommand } from './points/rank.js';
import { leaderboardCommand } from './points/leaderboard.js';
import { dailyCommand } from './points/daily.js';
import { addPointsCommand } from './points/addPoints.js';
import { removePointsCommand } from './points/removePoints.js';
import { setPointsCommand } from './points/setPoints.js';
import { addXpCommand } from './points/addXp.js';
import { setLevelCommand } from './points/setLevel.js';

// Economy
import { balanceCommand } from './economy/balance.js';
import { weeklyCommand } from './economy/weekly.js';
import { transferCommand } from './economy/transfer.js';
import { shopCommand } from './economy/shop.js';
import { buyCommand } from './economy/buy.js';
import { inventoryCommand } from './economy/inventory.js';

// Utility
import { suggestCommand } from './utility/suggest.js';
import { giveawayCommand } from './utility/giveaway.js';
import { helpCommand } from './utility/help.js';

export const commands: Command[] = [
  ticketPanelCommand,
  banCommand,
  unbanCommand,
  kickCommand,
  timeoutCommand,
  untimeoutCommand,
  warnCommand,
  warningsCommand,
  removeWarnCommand,
  clearWarnsCommand,
  clearCommand,
  lockCommand,
  unlockCommand,
  slowmodeCommand,
  setnameCommand,
  addRoleCommand,
  removeRoleCommand,
  pointsCommand,
  rankCommand,
  leaderboardCommand,
  dailyCommand,
  addPointsCommand,
  removePointsCommand,
  setPointsCommand,
  addXpCommand,
  setLevelCommand,
  balanceCommand,
  weeklyCommand,
  transferCommand,
  shopCommand,
  buyCommand,
  inventoryCommand,
  suggestCommand,
  giveawayCommand,
  helpCommand
];

export const commandMap = new Map<string, Command>();
for (const cmd of commands) {
  commandMap.set(cmd.data.name, cmd);
}
