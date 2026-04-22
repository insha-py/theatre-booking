import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // 1. Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. Check if already checked in
    if (booking.checkedIn) {
      return NextResponse.json({ 
        error: 'Already Checked In', 
        booking: {
          userEmail: booking.userEmail,
          showDate: booking.showDate,
          attendedAt: booking.attendedAt
        }
      }, { status: 409 });
    }

    // 3. Update attendance
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkedIn: true,
        attendedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      booking: {
        userEmail: updated.userEmail,
        showDate: updated.showDate,
        seats: updated.seats,
        attendedAt: updated.attendedAt
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
