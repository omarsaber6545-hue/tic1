import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;
    const body = await request.json();

    const { name, description, price, roleId, stock } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'اسم المنتج وسعره مطلوبان' },
        { status: 400 }
      );
    }

    const newItem = await prisma.shopItem.create({
      data: {
        guildId,
        name,
        description: description || '',
        price: parseInt(price, 10),
        roleId: roleId || null,
        stock: stock !== undefined ? parseInt(stock, 10) : -1
      }
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'فشل إضافة المنتج', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'معرف المنتج مطلوب' },
        { status: 400 }
      );
    }

    await prisma.shopItem.delete({
      where: {
        id: parseInt(itemId, 10),
        guildId
      }
    });

    return NextResponse.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'فشل حذف المنتج', error: error.message },
      { status: 500 }
    );
  }
}
