import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ bookings: [] });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userEmail: { contains: q, mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = await Promise.all(bookings.map(async (booking) => {
      const seatIds = booking.seats.split(',').map(s => s.trim()).filter(Boolean);
      const seats = await prisma.seat.findMany({
        where: { id: { in: seatIds } },
        select: { section: true, row: true, number: true }
      });
      return {
        id: booking.id,
        userEmail: booking.userEmail,
        showDate: booking.showDate,
        status: booking.status,
        checkedIn: booking.checkedIn,
        attendedAt: booking.attendedAt,
        seats: seats.map(s => `${s.section} R${s.row} S${s.number}`).join(', ')
      };
    }));

    return NextResponse.json({ bookings: enriched });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
