import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransporter } from '@/lib/nodemailer';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.endsWith('@ashoka.edu.in')) {
      return NextResponse.json({ error: 'Only @ashoka.edu.in emails are allowed.' }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    await prisma.oTP.upsert({
      where: { email },
      update: { code: otp, expiresAt },
      create: { email, code: otp, expiresAt }
    });

    // Send email
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: '"Ashoka Theatre" <no-reply@ashoka.edu.in>',
      to: email,
      subject: 'Your Theatre Booking OTP',
      text: `Your OTP is: ${otp}`,
      html: `<b>Your OTP is: ${otp}</b>`
    });

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
