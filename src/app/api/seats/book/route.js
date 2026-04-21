import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const { seatIds, showDate } = await request.json();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in with an Ashoka email.' }, { status: 401 });
    }
    
    const userEmail = session.user.email;

    if (!showDate) {
      return NextResponse.json({ error: 'Show date is required.' }, { status: 400 });
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 2) {
      return NextResponse.json({ error: 'You can only select up to 2 seats.' }, { status: 400 });
    }

    // Checking max 2 seats limit logic across existing bookings FOR THIS DATE
    const existingBookedCount = await prisma.seat.count({
      where: { userEmail: userEmail, status: 'BOOKED', showDate: showDate }
    });
    
    if (existingBookedCount + seatIds.length > 2) {
      return NextResponse.json({ error: `Maximum 2 seats allowed per user per show. You already have ${existingBookedCount} seats booked for this date.` }, { status: 400 });
    }

    // Atomic transaction simulation: Check availability mapping
    const requestedSeats = await prisma.seat.findMany({ where: { id: { in: seatIds }, showDate: showDate } });
    
    const now = new Date();
    const unavailable = requestedSeats.filter(
      s => s.status === 'BOOKED' || (s.status === 'LOCKED' && s.lockedUntil && s.lockedUntil > now && s.userEmail !== userEmail)
    );

    if (unavailable.length !== seatIds.length) {
       // This handles cases where seat IDs might be from wrong date or doesn't exist
       if (requestedSeats.length !== seatIds.length) {
         return NextResponse.json({ error: 'One or more invalid seats selected for this date.' }, { status: 400 });
       }
    }

    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'One or more seats are already taken or locked.' }, { status: 400 });
    }

    // Mark seats directly as BOOKED
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'BOOKED', lockedUntil: null, userEmail }
    });

    // Create a confirmed booking immediately
    const booking = await prisma.booking.create({
      data: {
        userEmail,
        showDate,
        seats: seatIds.join(','),
        status: 'CONFIRMED'
      }
    });

    // Fetch full seat details to return to the frontend
    const bookedSeats = await prisma.seat.findMany({
      where: { id: { in: seatIds } },
      select: { section: true, row: true, number: true }
    });

    // Generate QR Code containing booking ID and details
    const qrText = `Booking ID: ${booking.id}\nDate: ${showDate}\nSeats: ${bookedSeats.map(s => `${s.section} R${s.row} S${s.number}`).join(', ')}\nEmail: ${userEmail}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrText);

    return NextResponse.json({ 
      message: 'Booking confirmed', 
      bookingId: booking.id,
      seats: bookedSeats,
      userEmail,
      qrCode: qrCodeDataUrl 
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
