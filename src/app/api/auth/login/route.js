import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.endsWith('@ashoka.edu.in')) {
      return NextResponse.json({ error: 'Only @ashoka.edu.in emails are allowed.' }, { status: 400 });
    }

    // Upsert the User in the DB directly
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email }
    });

    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    
    // Set cookie using simple base64 encoded user string 
    const sessionStr = Buffer.from(user.id).toString('base64');

    response.cookies.set({
      name: 'theatre_session',
      value: sessionStr,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
