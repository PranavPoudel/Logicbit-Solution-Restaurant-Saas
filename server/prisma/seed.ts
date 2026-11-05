import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config'; // Ensure environment variables are loaded

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// =========================================================
// SAFETY & ENVIRONMENT CHECKS
// =========================================================
const isProduction = process.env.NODE_ENV === 'production';
const forceClear = process.env.FORCE_CLEAR_DB === 'true';

if (isProduction && !forceClear) {
  console.log('🛡️  Production environment detected. Skipping destructive database clear to protect live data.');
}

// =========================================================
// HELPER: CLEAR DATABASE (SAFE)
// =========================================================
async function clearDatabase() {
  if (isProduction && !forceClear) {
    return; // Silently skip in production unless explicitly forced
  }

  console.log('🧹 Clearing existing database data (TRUNCATE CASCADE)...');
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    const tableNames = tables
      .map((t) => t.tablename)
      .filter((name) => name !== '_prisma_migrations');

    if (tableNames.length > 0) {
      const tablesStr = tableNames.map((name) => `"public"."${name}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablesStr} RESTART IDENTITY CASCADE;`);
      console.log('✅ Database cleared successfully.\n');
    }
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    throw error;
  }
}

// =========================================================
// MAIN SEED FUNCTION
// =========================================================
async function main() {
  console.log('🌱 Starting minimal production seed (Admin, Customer, and Essential Master Data)...');

  // 0. CLEAR EXISTING DATA (Conditional & Safe)
  await clearDatabase();

  // 1. ESSENTIAL MASTER DATA (Idempotent Upserts)
  // Kept because the UI requires these reference tables to exist before adding real data.
  console.log('🔹 Setting up Essential Master Data...');
  
  const cuisineNames = ['Nepali', 'Newari', 'Fast Food', 'Chinese', 'Desserts', 'Indian', 'Italian', 'Japanese'];
  for (const name of cuisineNames) {
    await prisma.cuisine.upsert({
      where: { name }, // Matches @unique on name
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), isActive: true },
    });
  }

  const citiesData = [
    { name: 'Kathmandu', nameJa: 'カトマンズ', country: 'NP', latitude: 27.7172, longitude: 85.324, displayOrder: 1 },
    { name: 'Patan', nameJa: 'パタン', country: 'NP', latitude: 27.6766, longitude: 85.3142, displayOrder: 2 },
    { name: 'Bhaktapur', nameJa: 'バクタプル', country: 'NP', latitude: 27.671, longitude: 85.4298, displayOrder: 3 },
    { name: 'Pokhara', nameJa: 'ポカラ', country: 'NP', latitude: 28.2096, longitude: 83.9856, displayOrder: 4 },
    { name: 'Chitwan', nameJa: 'チトワン', country: 'NP', latitude: 27.5291, longitude: 84.3542, displayOrder: 5 },
  ];

  for (const city of citiesData) {
    await prisma.city.upsert({
      where: { name_country: { name: city.name, country: city.country } }, // Matches @@unique([name, country])
      update: { nameJa: city.nameJa, latitude: city.latitude, longitude: city.longitude, displayOrder: city.displayOrder },
      create: city,
    });
  }

  const plans = [
    { name: 'Free Tier', durationMonths: 1, price: 0, isActive: true },
    { name: 'Basic Monthly', durationMonths: 1, price: 2999, isActive: true },
    { name: 'Pro Plan', durationMonths: 12, price: 2999, isActive: true },
    { name: 'Basic Annual', durationMonths: 12, price: 29990, isActive: true },
    { name: 'Pro Annual', durationMonths: 12, price: 59990, isActive: true },
    { name: 'Lifetime Access', durationMonths: 0, price: 150000, isActive: true },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name }, // Matches @unique on name
      update: {},
      create: plan,
    });
  }

  // 2. PLATFORM STAFF RBAC (Super Admin)
  console.log('🔹 Setting up Platform Roles, Staff & Permissions...');
  
  const adminRole = await prisma.platformRole.upsert({
    where: { name: 'Super Admin' }, // Matches @unique on name
    update: {},
    create: { name: 'Super Admin' },
  });

  const requiredPermissions = [
    'VIEW_REVENUE', 'VIEW_RESTAURANTS', 'OVERRIDE_RESTAURANT_SETTINGS',
    'SUSPEND_RESTAURANT', 'MANAGE_COMMISSION', 'MODERATE_CONTENT',
    'MANAGE_PLATFORM_STAFF', 'MANAGE_SETTLEMENTS', 'MANAGE_SUBSCRIPTIONS',
    'MANAGE_ADVERTISEMENTS', 'MANAGE_CUISINES', 'MANAGE_CITIES', 'VIEW_DELIVERIES',
    'VIEW_ACTIVITY_LOGS', 'PROCESS_REFUNDS',
  ];

  for (const perm of requiredPermissions) {
    await prisma.platformPermission.upsert({
      where: { name: perm }, // Matches @unique on name
      update: {},
      create: { name: perm, description: `Allows ${perm.toLowerCase().replace(/_/g, ' ')}` },
    });
  }

  const allPermissions = await prisma.platformPermission.findMany();
  const existingRolePerms = await prisma.platformRolePermission.findMany({ where: { roleId: adminRole.id } });
  
  if (existingRolePerms.length === 0) {
    await prisma.platformRolePermission.createMany({ 
      data: allPermissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
      skipDuplicates: true,
    });
  }

  // 3. CREATE SUPER ADMIN ACCOUNT
  console.log('🔹 Setting up Super Admin Account...');
  const bootstrapEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@logicbit.local';
  const bootstrapPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminPassword = await bcrypt.hash(bootstrapPassword, SALT_ROUNDS);

  await prisma.platformStaff.upsert({
    where: { email: bootstrapEmail }, // Matches @unique on email
    update: { 
      passwordHash: adminPassword,
      roleId: adminRole.id 
    },
    create: { 
      name: 'Super Admin', 
      email: bootstrapEmail, 
      passwordHash: adminPassword, 
      roleId: adminRole.id 
    },
  });

  // 4. CREATE TEST CUSTOMER ACCOUNT
  console.log('🔹 Setting up Test Customer Account...');
  const customerEmail = 'customer@test.com';
  const customerPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  await prisma.customer.upsert({
    where: { email: customerEmail }, // Matches @unique on email
    update: { 
      passwordHash: customerPassword 
    },
    create: { 
      name: 'Test Customer', 
      email: customerEmail, 
      passwordHash: customerPassword, 
      isGuest: false 
    },
  });

  console.log('\n🎉 Minimal seed completed successfully!');
  console.log('\n📝 Test Accounts Ready:');
  console.log(`  Platform Admin: ${bootstrapEmail} (Password: ${bootstrapPassword})`);
  console.log(`  Test Customer:  ${customerEmail} (Password: password123)`);
  console.log('\n💡 Note: All mock restaurants, menus, orders, and reviews have been omitted.');
  console.log('   You can now log in as the Super Admin to input real production data.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });