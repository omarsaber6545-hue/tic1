import { Message, TextChannel } from 'discord.js';
import { AutoModService } from '../services/autoModService.js';
import { LevelService } from '../services/levelService.js';

export async function onMessageCreate(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  // 1. Process AutoMod Filters
  const intercepted = await AutoModService.processMessage(message);
  if (intercepted) {
    return; // Message was deleted or punished
  }

  // 2. Process XP & Points Activity
  if (message.member && message.channel instanceof TextChannel) {
    await LevelService.handleMessageActivity(
      message.guild,
      message.member,
      message.channel
    );
  }
}
