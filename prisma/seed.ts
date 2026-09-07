import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with faker.js...');

  // Create a real bcrypt hash for 'password123' so you can actually log in!
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // Create 50 Users
  const users = [];
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `test${i + 1}@example.com`,
        password_hash: defaultPasswordHash,
        image: faker.image.avatar(),
        emailVerified: faker.date.recent(),
      },
    });
    users.push(user);
  }

  console.log('Created 50 users.');
  console.log('Database seeding completed successfully! No products or bids generated per user request.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
