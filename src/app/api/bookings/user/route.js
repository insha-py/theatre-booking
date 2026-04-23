import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Fetch all bookings for this user
    const bookings = await prisma.booking.findMany({
      where: { userEmail },
      orderBy: { createdAt: 'desc' }
    });

    // For each booking, fetch the seat details
    const bookingsWithSeats = await Promise.all(
      bookings.map(async (booking) => {
        const seatIds = booking.seats.split(',');
        const seats = await prisma.seat.findMany({
          where: { id: { in: seatIds } },
          select: { section: true, row: true, number: true }
        });
        return {
          ...booking,
          seats: seats
        };
      })
    );

    return NextResponse.json({ bookings: bookingsWithSeats });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
