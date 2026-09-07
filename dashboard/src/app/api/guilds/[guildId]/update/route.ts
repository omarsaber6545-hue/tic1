import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;
    const body = await request.json();

    const allowedFields = [
      'welcomeEnabled',
      'welcomeChannelId',
      'welcomeMessage',
      'welcomeDmEnabled',
      'welcomeDmMessage',
      'autoRoleId',
      'pointsEnabled',
      'xpEnabled',
      'xpRate',
      'xpCooldown',
      'pointsPerMsg',
      'levelUpChannelId',
      'levelUpMessage',
      'dailyReward',
      'weeklyReward',
      'ticketsEnabled',
      'ticketCategoryId',
      'supportRoleId',
      'ticketLogChannelId',
      'ticketMessage',
      'autoModEnabled',
      'antiSpam',
      'antiFlood',
      'antiInvite',
      'antiLinks',
      'antiDuplicate',
      'antiMentionSpam',
      'badWords',
      'spamThreshold',
      'mentionThreshold',
      'autoModAction',
      'warnEscalation3',
      'warnEscalation5',
      'warnEscalation7',
      'logChannelId',
      'logJoinLeave',
      'logMessages',
      'logModeration',
      'logTickets',
      'logRoles',
      'logChannels',
      'logServer',
      'currencyName',
      'currencySymbol',
      'dailyAmount',
      'weeklyAmount'
    ];

    const dataToUpdate: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        dataToUpdate[field] = body[field];
      }
    }

    const updated = await prisma.guildSettings.upsert({
      where: { guildId },
      update: dataToUpdate,
      create: {
        guildId,
        ...dataToUpdate
      }
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('[API Update Settings Error]:', error);
    return NextResponse.json(
      { success: false, message: 'تعذر تحديث الإعدادات', error: error.message },
      { status: 500 }
    );
  }
}
