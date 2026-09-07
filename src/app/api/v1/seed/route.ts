import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("secret") !== "reset123") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log('Clearing existing data...');
    await prisma.bid.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
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

    return NextResponse.json({ message: "Database reset and seeded with 50 users successfully!" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Seed failed", error: error.message }, { status: 500 });
  }
}
