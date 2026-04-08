import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const result = await prisma.seat.updateMany({
      where: {
        status: 'LOCKED',
        lockedUntil: {
          lt: now
        }
      },
      data: {
        status: 'AVAILABLE',
        lockedUntil: null,
        lockedBy: null,
        userId: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      releasedCount: result.count 
    });
  } catch (error) {
    console.error('Error releasing seats via cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
