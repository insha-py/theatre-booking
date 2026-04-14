import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(request) {
  try {
    const { seatIds } = await request.json();
    const tokenCookie = request.cookies.get('theatre_session');
    
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = Buffer.from(tokenCookie.value, 'base64').toString('ascii');

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 2) {
      return NextResponse.json({ error: 'You can only select up to 2 seats.' }, { status: 400 });
    }

    // Checking max 2 seats limit logic across existing bookings
    const existingBookedCount = await prisma.seat.count({
      where: { userId: userId, status: 'BOOKED' }
    });
    
    if (existingBookedCount + seatIds.length > 2) {
      return NextResponse.json({ error: 'Maximum 2 seats allowed per user.' }, { status: 400 });
    }

    // Atomic transaction simulation: Check availability mapping
    const requestedSeats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });
    
    const now = new Date();
    const unavailable = requestedSeats.filter(
      s => s.status === 'BOOKED' || (s.status === 'LOCKED' && s.lockedUntil && s.lockedUntil > now && s.lockedBy !== userId)
    );

    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'One or more seats are already taken or locked.' }, { status: 400 });
    }

    // Mark seats directly as BOOKED
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'BOOKED', lockedUntil: null, lockedBy: userId, userId }
    });

    // Create a confirmed booking immediately
    const booking = await prisma.booking.create({
      data: {
        userId,
        seats: seatIds.join(','),
        amount: 0, // No payment logic required
        status: 'CONFIRMED'
      }
    });

    // Generate QR Code containing booking ID and details
    const qrText = `Booking ID: ${booking.id}\nSeats: ${booking.seats}\nUser: ${userId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrText);

    return NextResponse.json({ 
      message: 'Booking confirmed', 
      bookingId: booking.id,
      seats: booking.seats,
      qrCode: qrCodeDataUrl 
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
