import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(request) {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    const tokenCookie = request.cookies.get('theatre_session');
    
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    // When using test mock, we can bypass actual signature check if it's sent as mock
    if (razorpay_signature !== 'mock_signature') {
      const expectedSignature = crypto.createHmac('sha256', secret)
                                      .update(razorpay_order_id + "|" + razorpay_payment_id)
                                      .digest('hex');
      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
      }
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'Already confirmed' }, { status: 400 });
    }

    // Checking max 2 seats limit logic
    const seatIds = booking.seats.split(',');
    const existingBookedCount = await prisma.seat.count({
      where: { userId: booking.userId, status: 'BOOKED' }
    });
    
    if (existingBookedCount + seatIds.length > 2) {
      return NextResponse.json({ error: 'Maximum 2 seats allowed per user across all bookings.' }, { status: 400 });
    }

    // Ensure they still have the lock
    const seats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });
    const now = new Date();

    const lostLocks = seats.filter(s => s.lockedBy !== booking.userId || (s.lockedUntil && s.lockedUntil < now));

    if (lostLocks.length > 0) {
      return NextResponse.json({ error: 'Session expired. Seats were released.' }, { status: 400 });
    }

    // Confirm booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', paymentId: razorpay_payment_id }
    });

    // Mark seats as permanently booked
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'BOOKED', lockedUntil: null }
    });

    // Generate QR Code containing booking ID and details
    const qrText = `Booking ID: ${bookingId}\nSeats: ${booking.seats}\nAmount: ${booking.amount}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrText);

    return NextResponse.json({ 
      message: 'Booking confirmed', 
      qrCode: qrCodeDataUrl 
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
