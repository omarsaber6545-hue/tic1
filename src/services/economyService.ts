import { Guild, GuildMember } from 'discord.js';
import prisma from '../database/prisma.js';

export class EconomyService {
  /**
   * Get member balance and server currency info
   */
  public static async getMemberBalance(guildId: string, userId: string) {
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId }
    });

    const member = await prisma.member.upsert({
      where: { guildId_userId: { guildId, userId } },
      update: {},
      create: { guildId, userId }
    });

    return {
      balance: member.balance,
      bank: member.bank,
      total: member.balance + member.bank,
      currencyName: settings?.currencyName || 'دينار',
      currencySymbol: settings?.currencySymbol || '🪙'
    };
  }

  /**
   * Transfer coins between members
   */
  public static async transferCoins(
    guildId: string,
    senderId: string,
    receiverId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    if (senderId === receiverId) {
      return { success: false, message: 'لا يمكنك تحويل العملات لنفسك!' };
    }

    if (amount <= 0) {
      return { success: false, message: 'المبلغ المحول يجب أن يكون أكبر من 0!' };
    }

    const sender = await prisma.member.findUnique({
      where: { guildId_userId: { guildId, userId: senderId } }
    });

    if (!sender || sender.balance < amount) {
      return { success: false, message: 'رصيدك الحالي غير كافٍ لإتمام هذه المعاملة!' };
    }

    // Atomic transaction
    await prisma.$transaction([
      prisma.member.update({
        where: { guildId_userId: { guildId, userId: senderId } },
        data: { balance: { decrement: amount } }
      }),
      prisma.member.upsert({
        where: { guildId_userId: { guildId, userId: receiverId } },
        update: { balance: { increment: amount } },
        create: { guildId, userId: receiverId, balance: amount }
      })
    ]);

    return { success: true, message: `تم تحويل **${amount}** بنجاح إلى <@${receiverId}>!` };
  }

  /**
   * Get server shop items
   */
  public static async getShopItems(guildId: string) {
    return prisma.shopItem.findMany({
      where: { guildId },
      orderBy: { price: 'asc' }
    });
  }

  /**
   * Buy item from shop
   */
  public static async buyItem(
    guild: Guild,
    member: GuildMember,
    itemId: number
  ): Promise<{ success: boolean; message: string }> {
    const item = await prisma.shopItem.findFirst({
      where: { id: itemId, guildId: guild.id }
    });

    if (!item) {
      return { success: false, message: 'المنتج غير موجود في متجر السيرفر.' };
    }

    if (item.stock !== -1 && item.stock <= 0) {
      return { success: false, message: 'نفدت كمية هذا المنتج من المتجر!' };
    }

    const memberData = await prisma.member.findUnique({
      where: { guildId_userId: { guildId: guild.id, userId: member.id } }
    });

    if (!memberData || memberData.balance < item.price) {
      return {
        success: false,
        message: `ليس لديك رصيد كافٍ لشراء هذا المنتج! سعره: **${item.price}**، رصيدك: **${memberData?.balance || 0}**`
      };
    }

    // Deduct balance and update stock
    await prisma.$transaction([
      prisma.member.update({
        where: { guildId_userId: { guildId: guild.id, userId: member.id } },
        data: { balance: { decrement: item.price } }
      }),
      prisma.shopItem.update({
        where: { id: itemId },
        data: item.stock !== -1 ? { stock: { decrement: 1 } } : {}
      }),
      prisma.inventoryItem.create({
        data: {
          guildId: guild.id,
          userId: member.id,
          itemId: item.id,
          quantity: 1
        }
      })
    ]);

    // Give role reward if linked
    if (item.roleId) {
      try {
        const role = await guild.roles.fetch(item.roleId).catch(() => null);
        if (role) {
          await member.roles.add(role, `شراء رتبة من المتجر: ${item.name}`);
        }
      } catch (err) {
        console.error('[EconomyService] خطأ في إعطاء رتبة المتجر:', err);
      }
    }

    return {
      success: true,
      message: `🎉 تهانينا! قمت بشراء **${item.name}** بنجاح مقابل **${item.price}**!`
    };
  }

  /**
   * Get user inventory
   */
  public static async getInventory(guildId: string, userId: string) {
    return prisma.inventoryItem.findMany({
      where: { guildId, userId },
      include: { item: true },
      orderBy: { boughtAt: 'desc' }
    });
  }
}
