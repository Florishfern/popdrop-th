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

  // Check if Art Toy products exist
  try {
    const artToyCount = await prisma.product.count({
      where: {
        OR: [
          { category: 'Art Toy' },
          { category: { contains: 'toy' } }
        ]
      }
    });

    if (artToyCount === 0) {
      const now = new Date();
      const futureDate = (days) => new Date(now.getTime() + days * 86400000);
      const pastDate = (days) => new Date(now.getTime() - days * 86400000);

      await prisma.product.create({
        data: {
          sellerId: admin.id,
          title: "Hirono Little Mischief Series",
          category: "Art Toy",
          startPrice: 650,
          currentPrice: 850,
          description: "Hirono Little Mischief Series collectible art toy by POP MART. Authentic blind box figure in mint condition with original box.",
          startTime: pastDate(1),
          endTime: futureDate(5),
          status: "LIVE",
          images: {
            create: [{ imageUrl: "/images/hirono.png", sortOrder: 0 }]
          }
        }
      });

      await prisma.product.create({
        data: {
          sellerId: admin.id,
          title: "Skullpanda City of Night",
          category: "Art Toy",
          startPrice: 750,
          currentPrice: 950,
          description: "Skullpanda City of Night series collectible art toy figure. Includes original collector identity card.",
          startTime: pastDate(1),
          endTime: futureDate(4),
          status: "LIVE",
          images: {
            create: [{ imageUrl: "/images/skull.png", sortOrder: 0 }]
          }
        }
      });

      await prisma.product.create({
        data: {
          sellerId: admin.id,
          title: "Gundam RX-78-2 Ver.Ka Custom",
          category: "Model",
          startPrice: 1800,
          currentPrice: 2400,
          description: "Master Grade 1/100 scale Gundam RX-78-2 Ver.Ka model kit with custom water slide decals and matte protective finish.",
          startTime: pastDate(1),
          endTime: futureDate(6),
          status: "LIVE",
          images: {
            create: [{ imageUrl: "/images/gundum.png", sortOrder: 0 }]
          }
        }
      });

      console.log("✅ Seeded sample Art Toy and Model demo products");
    }
  } catch (err) {
    console.error("Note on seeding category products:", err);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding admin user:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
