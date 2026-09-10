const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userId = "test_user_id"; // I need a real user ID. Let's find one.
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  console.log("User:", user.id);
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sellerInfo: {
          upsert: {
            create: { idCardImageUrl: "test.png", idCardStatus: "PENDING" },
            update: { idCardImageUrl: "test.png", idCardStatus: "PENDING" },
          }
        }
      },
    });
    console.log("Success:", updatedUser.id);
  } catch(e) {
    console.error("Error:", e);
  }
}
test().then(() => prisma.$disconnect());
