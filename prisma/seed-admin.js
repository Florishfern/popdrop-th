const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Precomputed bcrypt hash (cost 10) for 'Admin1234!' so bcryptjs is NOT required at runtime
const ADMIN_PASSWORD_HASH = "$2b$10$M.YNccikXPUs2AdFQ9P/..Mv4K1o11LqT21eLIER89JG1haZDRieK";

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@popdrop.com').trim().toLowerCase();

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      isAdmin: true,
      name: 'System Administrator (SRE)',
      password_hash: ADMIN_PASSWORD_HASH,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      name: 'System Administrator (SRE)',
      role: 'ADMIN',
      isAdmin: true,
      password_hash: ADMIN_PASSWORD_HASH,
      image: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminSRE',
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Admin account ensured in database: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Account 
      MODIFY COLUMN refresh_token TEXT,
      MODIFY COLUMN access_token TEXT,
      MODIFY COLUMN id_token TEXT;
    `);
    console.log('✅ Account table columns verified for OAuth tokens (TEXT)');
  } catch (err) {
    // Ignore if not MySQL or columns already TEXT
  }
}

main()
  .catch((e) => {
    console.error('Error seeding admin user:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
