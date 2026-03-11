import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default fare config
  await prisma.fareConfig.upsert({
    where: { id: "default-fare-config" },
    update: {},
    create: {
      id: "default-fare-config",
      vehicleType: "AUTO_RICKSHAW",
      baseFare: 30,
      perKmRate: 12,
      perMinuteRate: 1.5,
      nightCharge: 1.25,
      surgeMultiplier: 1.0,
      isActive: true,
    },
  });
  console.log("✅ Fare config created");

  // Create super admin
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@autoriksha.in" },
    update: {},
    create: {
      firebaseUid: "admin-super-001",
      email: "admin@autoriksha.in",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Super admin created:", superAdmin.email);

  // Create app settings
  const defaultSettings = [
    { key: "platform_commission_percent", value: "15", description: "Platform commission percentage on each ride" },
    { key: "max_ride_radius_km", value: "5", description: "Maximum radius for ride matching in km" },
    { key: "ride_acceptance_timeout_seconds", value: "30", description: "Time for driver to accept ride" },
    { key: "min_wallet_topup", value: "100", description: "Minimum wallet topup amount in INR" },
    { key: "max_wallet_topup", value: "10000", description: "Maximum wallet topup amount in INR" },
    { key: "support_email", value: "support@autoriksha.in", description: "Support contact email" },
    { key: "support_phone", value: "+919876543210", description: "Support contact phone" },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("✅ App settings created");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
