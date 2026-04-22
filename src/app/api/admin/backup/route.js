import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const seats = await prisma.seat.findMany();
    const bookings = await prisma.booking.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      seats,
      bookings
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="theatre_booking_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup generation failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
