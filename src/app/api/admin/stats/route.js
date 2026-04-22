import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany();
    
    const stats = {
      '2026-04-25': { booked: 0, checkedIn: 0 },
      '2026-04-26': { booked: 0, checkedIn: 0 }
    };

    bookings.forEach(b => {
      if (stats[b.showDate]) {
        stats[b.showDate].booked += b.seats.split(',').length;
        if (b.checkedIn) {
          stats[b.showDate].checkedIn += b.seats.split(',').length;
        }
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
