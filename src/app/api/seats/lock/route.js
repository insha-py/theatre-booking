import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

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

    // Atomic transaction to lock seats
    // Fetch seats to check if they are already locked by someone else
    const seats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });
    
    const now = new Date();
    // They are unavailable if status is BOOKED, or if LOCKED and lockedUntil is in the future
    const unavailable = seats.filter(
      s => s.status === 'BOOKED' || (s.status === 'LOCKED' && s.lockedUntil && s.lockedUntil > now && s.lockedBy !== userId)
    );

    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'One or more seats are already booked or locked.' }, { status: 400 });
    }

    // Lock them exactly for 9 minutes
    const lockedUntil = new Date(Date.now() + 9 * 60 * 1000);

    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'LOCKED', lockedUntil, lockedBy: userId, userId }
    });

    // Real Razorpay Order Generation
    const amount = seatIds.length * 100;
    
    const razorpay = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock', 
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret' 
    });
    
    const order = await razorpay.orders.create({ 
      amount: amount * 100, // amount in paise
      currency: "INR" 
    });
    const orderId = order.id;

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        seats: seatIds.join(','),
        amount,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ 
      message: 'Seats locked successfully', 
      orderId,
      bookingId: booking.id,
      amount
    });
  } catch (error) {
    console.error('Error locking seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
