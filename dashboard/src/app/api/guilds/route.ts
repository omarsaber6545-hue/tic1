import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let guilds = await prisma.guild.findMany({
      include: {
        _count: {
          select: {
            members: true,
            tickets: true,
            warnings: true
          }
        }
      }
    });

    // If database is empty, create an initial default guild so the dashboard is immediately usable
    if (guilds.length === 0) {
      const defaultGuild = await prisma.guild.create({
        data: {
          id: '123456789012345678',
          name: 'مجتمع ديسكورد العربي الرئيسي',
          icon: null,
          settings: {
            create: {
              welcomeEnabled: true,
              welcomeMessage: 'أهلاً بك {user} في سيرفر {server}! أنت العضو رقم {count} 🌟',
              pointsEnabled: true,
              xpEnabled: true,
              ticketsEnabled: true,
              autoModEnabled: true,
              currencyName: 'دينار',
              currencySymbol: '🪙'
            }
          }
        },
        include: {
          _count: {
            select: {
              members: true,
              tickets: true,
              warnings: true
            }
          }
        }
      });
      guilds = [defaultGuild];
    }

    return NextResponse.json({ success: true, guilds });
  } catch (error: any) {
    console.error('[API /api/guilds Error]:', error);
    return NextResponse.json(
      { success: false, message: 'تعذر جلب قائمة السيرفرات', error: error.message },
      { status: 500 }
    );
  }
}
