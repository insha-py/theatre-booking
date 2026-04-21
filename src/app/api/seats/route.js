import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      console.log('Resetting all seats...');
      await prisma.seat.deleteMany();
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    let seats = await prisma.seat.findMany({ where: { showDate: date } });

    // If it's empty for this date, let's initialize if it's one of our target dates
    if (seats.length === 0 && (date === '2026-04-25' || date === '2026-04-26')) {
      console.log(`Initializing seats for ${date}...`);
      const initSeats = [];

      // LEFT section: 3 rows x 7 seats = 21
      for (let r = 1; r <= 3; r++) {
        for (let n = 1; n <= 7; n++) {
          initSeats.push({ section: 'LEFT', row: r, number: n, showDate: date });
        }
      }

      // MIDDLE section: 5 rows
      for (let r = 1; r <= 5; r++) {
        const capacity = r <= 2 ? 21 : 28;
        for (let n = 1; n <= capacity; n++) {
          initSeats.push({ section: 'MIDDLE', row: r, number: n, showDate: date });
        }
      }

      // RIGHT section: 3 rows x 7 seats = 21
      for (let r = 1; r <= 3; r++) {
        for (let n = 1; n <= 7; n++) {
          initSeats.push({ section: 'RIGHT', row: r, number: n, showDate: date });
        }
      }

      await prisma.seat.createMany({ data: initSeats });
      seats = await prisma.seat.findMany({ where: { showDate: date } });
    }

    // Now let's release any locks that expired (older than 9 minutes)
    const now = new Date();
    const locksToRelease = seats.filter(s => s.status === 'LOCKED' && s.lockedUntil && s.lockedUntil < now);

    if (locksToRelease.length > 0) {
      await prisma.seat.updateMany({
        where: { id: { in: locksToRelease.map(s => s.id) } },
        data: { status: 'AVAILABLE', lockedUntil: null, userEmail: null }
      });
      seats = await prisma.seat.findMany({ where: { showDate: date } });
    }

    return NextResponse.json({ seats });
  } catch (error) {
    console.error('Error in fetch seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
