import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      console.log('Resetting seats...');
      await prisma.seat.deleteMany();
    }

    let seats = await prisma.seat.findMany();

    // If it's empty, let's initialize the seats!
    if (seats.length === 0) {
      console.log('Initializing seeds with new layout...');
      const initSeats = [];

      // LEFT section: 3 rows x 7 seats = 21
      for (let r = 1; r <= 3; r++) {
        for (let n = 1; n <= 7; n++) {
          initSeats.push({ section: 'LEFT', row: r, number: n });
        }
      }

      // MIDDLE section: 5 rows
      // Rows 1-2: 21 seats each, Rows 3-5: 28 seats each
      for (let r = 1; r <= 5; r++) {
        const capacity = r <= 2 ? 21 : 28;
        for (let n = 1; n <= capacity; n++) {
          initSeats.push({ section: 'MIDDLE', row: r, number: n });
        }
      }

      // RIGHT section: 3 rows x 7 seats = 21
      for (let r = 1; r <= 3; r++) {
        for (let n = 1; n <= 7; n++) {
          initSeats.push({ section: 'RIGHT', row: r, number: n });
        }
      }

      await prisma.seat.createMany({ data: initSeats });
      seats = await prisma.seat.findMany();
    }

    // Now let's release any locks that expired (older than 9 minutes)
    const now = new Date();
    const locksToRelease = seats.filter(s => s.status === 'LOCKED' && s.lockedUntil && s.lockedUntil < now);

    if (locksToRelease.length > 0) {
      await prisma.seat.updateMany({
        where: { id: { in: locksToRelease.map(s => s.id) } },
        data: { status: 'AVAILABLE', lockedUntil: null, userEmail: null }
      });
      seats = await prisma.seat.findMany();
    }

    return NextResponse.json({ seats });
  } catch (error) {
    console.error('Error in fetch seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
