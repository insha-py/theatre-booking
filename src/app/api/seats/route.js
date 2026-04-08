import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let seats = await prisma.seat.findMany();

    // If it's empty, let's initialize the seats!
    if (seats.length === 0) {
      console.log('Initializing seeds...');
      const initSeats = [];
      
      // LEFT section: 4x10 = 40
      for (let r = 1; r <= 4; r++) {
        for (let n = 1; n <= 10; n++) {
          initSeats.push({ section: 'LEFT', row: r, number: n });
        }
      }
      // MIDDLE section: 6x15 = 90
      for (let r = 1; r <= 6; r++) {
        for (let n = 1; n <= 15; n++) {
          initSeats.push({ section: 'MIDDLE', row: r, number: n });
        }
      }
      // RIGHT section: 4x10 = 40
      for (let r = 1; r <= 4; r++) {
        for (let n = 1; n <= 10; n++) {
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
        data: { status: 'AVAILABLE', lockedUntil: null, lockedBy: null }
      });
      // Re-fetch to return accurate data
      seats = await prisma.seat.findMany();
    }

    return NextResponse.json({ seats });
  } catch (error) {
    console.error('Error in fetch seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
