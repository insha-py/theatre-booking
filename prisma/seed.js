const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing seats...');
  await prisma.seat.deleteMany({});

  console.log('Generating 170 seats...');
  const seats = [];

  // LEFT SECTION: 4 rows x 10 seats = 40
  for (let r = 1; r <= 4; r++) {
    for (let n = 1; n <= 10; n++) {
      seats.push({ section: 'LEFT', row: r, number: n, status: 'AVAILABLE' });
    }
  }

  // MIDDLE SECTION: 6 rows x 15 seats = 90
  for (let r = 1; r <= 6; r++) {
    for (let n = 1; n <= 15; n++) {
      seats.push({ section: 'MIDDLE', row: r, number: n, status: 'AVAILABLE' });
    }
  }

  // RIGHT SECTION: 4 rows x 10 seats = 40
  for (let r = 1; r <= 4; r++) {
    for (let n = 1; n <= 10; n++) {
      seats.push({ section: 'RIGHT', row: r, number: n, status: 'AVAILABLE' });
    }
  }

  await prisma.seat.createMany({ data: seats });
  console.log('Successfully seeded 170 seats!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
