import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Send email using SendGrid HTTP API to bypass Render firewall and recipient restrictions
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDER_EMAIL) {
      return NextResponse.json({ error: 'System configuration error: Missing SENDGRID_API_KEY or SENDER_EMAIL.' }, { status: 500 });
    }

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
      },
      body: JSON.stringify({
        personalizations: [
          { to: [{ email: email }] }
        ],
        from: { 
          email: process.env.SENDER_EMAIL, 
          name: 'Ashoka Theatre' 
        },
        subject: 'Your Theatre Booking OTP',
        content: [
          {
            type: 'text/html',
            value: `<b>Your OTP is: ${otp}</b>`
          }
        ]
      })
    });

    if (!emailResponse.ok) {
        const errData = await emailResponse.text();
        console.error('SendGrid API Error:', errData);
        return NextResponse.json({ error: 'Failed to dispatch email over API.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
