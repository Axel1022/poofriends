import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.reaction.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.streak.deleteMany({});
  await prisma.bathroomLog.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Cleared existing data");

  // Create admin/superroot user ONLY
  const adminPassword = await bcrypt.hash("admin123456", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@poofriends.com",
      password: adminPassword,
      name: "Super Admin",
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
      createdAt: new Date(),
    },
  });

  console.log("✅ Created super admin user");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n" + "=".repeat(60));
  console.log("🔐 CUENTA SUPER ROOT / ADMIN");
  console.log("=".repeat(60));
  console.log(`Email:    admin@poofriends.com`);
  console.log(`Password: admin123456`);
  console.log(`Role:     ADMIN`);
  console.log(`Permisos: Gestión completa de usuarios (suspender, activar, eliminar)`);
  console.log("=".repeat(60));
  console.log("\n💡 Esta es la única cuenta creada en la base de datos.");
  console.log("   Los nuevos usuarios se registrarán mediante la aplicación.\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });