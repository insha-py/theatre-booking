import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import QRCode from 'qrcode';

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
        let qrCode = booking.qrCode;
        if (!qrCode) {
          try {
            const qrText = `Booking ID: ${booking.id}\nDate: ${booking.showDate}\nSeats: ${seats.map(s => `${s.section} R${s.row} S${s.number}`).join(', ')}\nEmail: ${booking.userEmail}`;
            qrCode = await QRCode.toDataURL(qrText);
            await prisma.booking.update({ where: { id: booking.id }, data: { qrCode } });
          } catch {
            qrCode = null;
          }
        }
        return {
          ...booking,
          seats,
          qrCode
        };
      })
    );

    return NextResponse.json({ bookings: bookingsWithSeats });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
