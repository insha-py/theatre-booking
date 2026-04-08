import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const otpRecord = await prisma.oTP.findUnique({ where: { email } });

    if (!otpRecord) {
      return NextResponse.json({ error: 'No OTP found or OTP expired' }, { status: 400 });
    }

    if (otpRecord.code !== code) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid. Find or create user.
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    // Clear the OTP so it can't be reused
    await prisma.oTP.delete({ where: { email } });

    // In a real app we would use JWT or a Session DB model.
    // For this demonstration, we'll set an HTTP-Only cookie with the user's ID
    // and sign/encrypt it. To keep it simple here, we just base64 encode it.
    const sessionToken = Buffer.from(user.id).toString('base64');
    
    const response = NextResponse.json({ message: 'Authentication successful', user });
    
    // Set cookie
    response.cookies.set({
      name: 'theatre_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
