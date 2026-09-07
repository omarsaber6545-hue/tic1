import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;
    const { searchParams } = new URL(request.url);
    const warnId = searchParams.get('warnId');

    if (!warnId) {
      return NextResponse.json(
        { success: false, message: 'رقم التحذير مطلوب' },
        { status: 400 }
      );
    }

    await prisma.warning.delete({
      where: {
        id: parseInt(warnId, 10),
        guildId
      }
    });

    return NextResponse.json({ success: true, message: 'تم مسح التحذير بنجاح' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'تعذر حذف التحذير', error: error.message },
      { status: 500 }
    );
  }
}
