const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@popdrop.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      isAdmin: true,
      name: 'System Administrator (SRE)',
      password_hash: hashedPassword,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      name: 'System Administrator (SRE)',
      role: 'ADMIN',
      isAdmin: true,
      password_hash: hashedPassword,
      image: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminSRE',
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Admin account ensured in database: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error('Error seeding admin user:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
