import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;

    let guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        settings: true,
        shopItems: true,
        warnings: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 15
        },
        members: {
          orderBy: [{ level: 'desc' }, { xp: 'desc' }],
          take: 10
        }
      }
    });

    if (!guild) {
      // Create guild if navigated directly
      guild = await prisma.guild.create({
        data: {
          id: guildId,
          name: 'سيرفر تجريبي',
          settings: {
            create: {}
          }
        },
        include: {
          settings: true,
          shopItems: true,
          warnings: true,
          tickets: true,
          members: true
        }
      });
    }

    if (!guild.settings) {
      const settings = await prisma.guildSettings.create({
        data: { guildId }
      });
      guild = { ...guild, settings };
    }

    // Aggregate stats
    const totalMembers = await prisma.member.count({ where: { guildId } });
    const openTicketsCount = await prisma.ticket.count({
      where: { guildId, status: { in: ['OPEN', 'CLAIMED'] } }
    });
    const totalWarnings = await prisma.warning.count({ where: { guildId } });

    return NextResponse.json({
      success: true,
      guild,
      stats: {
        totalMembers,
        openTicketsCount,
        totalWarnings
      }
    });
  } catch (error: any) {
    console.error('[API /api/guilds/[guildId] Error]:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ أثناء جلب بيانات السيرفر', error: error.message },
      { status: 500 }
    );
  }
}
