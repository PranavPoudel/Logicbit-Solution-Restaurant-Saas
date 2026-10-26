import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed...');

  // =========================================================
  // 1. PLATFORM ROLES, STAFF & PERMISSIONS
  // =========================================================
  console.log('🔹 Setting up Platform Roles, Staff & Permissions...');
  
  const adminRole = await prisma.platformRole.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin' },
  });

  const bootstrapEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@logicbit.local';
  const bootstrapPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'ChangeMe123!'; // Matched frontend docs
  const adminPassword = await bcrypt.hash(bootstrapPassword, SALT_ROUNDS);

  await prisma.platformStaff.upsert({
    where: { email: bootstrapEmail },
    update: { 
      name: 'Super Admin', 
      passwordHash: adminPassword, 
      roleId: adminRole.id 
    },
    create: {
      name: 'Super Admin',
      email: bootstrapEmail,
      passwordHash: adminPassword,
      roleId: adminRole.id,
    },
  });

  console.log('🛡️ Seeding Platform Permissions...');
  const requiredPermissions = [
    'VIEW_REVENUE', 'VIEW_RESTAURANTS', 'OVERRIDE_RESTAURANT_SETTINGS',
    'SUSPEND_RESTAURANT', 'MANAGE_COMMISSION', 'MODERATE_CONTENT',
    'MANAGE_PLATFORM_STAFF', 'MANAGE_SETTLEMENTS', 'MANAGE_SUBSCRIPTIONS',
    'MANAGE_ADVERTISEMENTS', 'MANAGE_CUISINES', 'MANAGE_CITIES', 'VIEW_DELIVERIES',
    'VIEW_ACTIVITY_LOGS', 'PROCESS_REFUNDS',
  ];

  for (const perm of requiredPermissions) {
    await prisma.platformPermission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm, description: `Allows ${perm.toLowerCase().replace(/_/g, ' ')}` },
    });
  }

  const allPermissions = await prisma.platformPermission.findMany();
  for (const permission of allPermissions) {
    await prisma.platformRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // =========================================================
  // 2. MASTER DATA (Cuisines & Subscription Plans)
  // =========================================================
  console.log('🔹 Setting up Master Data...');

  const cuisineNames = ['Nepali', 'Newari', 'Fast Food', 'Chinese', 'Desserts', 'Indian'];
  for (const name of cuisineNames) {
    await prisma.cuisine.upsert({
      where: { name },
      update: {},
      create: { 
        name, 
        slug: name.toLowerCase().replace(/\s+/g, '-'), 
        isActive: true 
      },
    });
  }

  const cities: { name: string; nameJa: string; latitude: number; longitude: number }[] = [
    { name: 'Kathmandu', nameJa: 'カトマンズ', latitude: 27.7172, longitude: 85.324 },
    { name: 'Patan', nameJa: 'パタン', latitude: 27.6766, longitude: 85.3142 },
    { name: 'Bhaktapur', nameJa: 'バクタプル', latitude: 27.671, longitude: 85.4298 },
    { name: 'Pokhara', nameJa: 'ポカラ', latitude: 28.2096, longitude: 83.9856 },
    { name: 'Chitwan', nameJa: 'チトワン', latitude: 27.5291, longitude: 84.3542 },
    { name: 'Biratnagar', nameJa: 'ビラトナガル', latitude: 26.4525, longitude: 87.2718 },
    { name: 'Butwal', nameJa: 'ブトワル', latitude: 27.7006, longitude: 83.4484 },
    { name: 'Dharan', nameJa: 'ダラン', latitude: 26.8065, longitude: 87.2846 },
    { name: 'Birgunj', nameJa: 'ビルガンジ', latitude: 27.0104, longitude: 84.8779 },
    { name: 'Janakpur', nameJa: 'ジャナクプル', latitude: 26.7288, longitude: 85.9266 },
    { name: 'Nepalgunj', nameJa: 'ネパールガンジ', latitude: 28.05, longitude: 81.6167 },
    { name: 'Hetauda', nameJa: 'ヘタウダ', latitude: 27.4287, longitude: 85.0322 },
    { name: 'Itahari', nameJa: 'イタハリ', latitude: 26.6646, longitude: 87.2718 },
    { name: 'Dhangadhi', nameJa: 'ダンガディ', latitude: 28.6869, longitude: 80.5986 },
    { name: 'Bharatpur', nameJa: 'バラトプル', latitude: 27.6833, longitude: 84.4333 },
    { name: 'Lumbini', nameJa: 'ルンビニ', latitude: 27.4833, longitude: 83.2765 },
  ];
  for (const [displayOrder, city] of cities.entries()) {
    await prisma.city.upsert({
      where: { name_country: { name: city.name, country: 'NP' } },
      update: {},
      create: { ...city, country: 'NP', displayOrder },
    });
  }

  console.log('💳 Seeding Subscription Plans...');
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
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  // Fetch the Pro Plan to use in restaurant scenarios safely
  const proPlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'Pro Plan' } });

  // =========================================================
  // 3. HELPER: Create Restaurant Scenario
  // =========================================================
  async function createRestaurantScenario(
    tenantName: string,
    ownerEmail: string,
    ownerName: string,
    restaurantName: string,
    slug: string,
    city: string,
    lat: number,
    lng: number,
    cuisineNamesToLink: string[],
    hasSubscription: boolean = false
  ) {
    const password = await bcrypt.hash('password123', SALT_ROUNDS);

    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    let tenantId = existingUser?.tenantId;

    if (!tenantId) {
      const tenant = await prisma.tenant.create({ data: { name: tenantName } });
      tenantId = tenant.id;
    }

    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {
        name: ownerName,
        passwordHash: password,
        isSuperAdmin: true,
      },
      create: {
        tenantId,
        name: ownerName,
        email: ownerEmail,
        passwordHash: password,
        isSuperAdmin: true,
      },
    });

    const restaurant = await prisma.restaurant.upsert({
      where: { slug },
      update: {
        tenantId,
        name: restaurantName,
        latitude: lat,
        longitude: lng,
        address: `123 Main Street, ${city}`,
        city,
        country: 'Nepal',
        isOpen: true,
        supportsDelivery: true,
        supportsPickup: true,
        supportsDineIn: true,
        selfDeliveryRadiusKm: 5,
        maxDeliveryRadiusKm: 10,
        selfDeliveryFlatFee: 60,
        platformCommissionPercent: 10,
        primaryColor: '#E3A008',
        secondaryColor: '#17181C',
      },
      create: {
        tenantId,
        name: restaurantName,
        slug,
        latitude: lat,
        longitude: lng,
        address: `123 Main Street, ${city}`,
        city,
        country: 'Nepal',
        isOpen: true,
        supportsDelivery: true,
        supportsPickup: true,
        supportsDineIn: true,
        selfDeliveryRadiusKm: 5,
        maxDeliveryRadiusKm: 10,
        selfDeliveryFlatFee: 60,
        platformCommissionPercent: 10,
        primaryColor: '#E3A008',
        secondaryColor: '#17181C',
      },
    });

    // Add Subscription if requested
    if (hasSubscription && proPlan) {
      await prisma.restaurantSubscription.upsert({
        where: { restaurantId: restaurant.id },
        update: {
          planId: proPlan.id,
          status: 'ACTIVE',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true,
        },
        create: {
          restaurantId: restaurant.id,
          planId: proPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true,
        },
      });
      console.log(`   ↳ ✅ Added ACTIVE Pro Plan subscription for ${restaurantName}`);
    }

    await prisma.restaurantCuisine.deleteMany({
      where: { restaurantId: restaurant.id },
    });

    const cuisines = await prisma.cuisine.findMany({
      where: { name: { in: cuisineNamesToLink } },
    });

    if (cuisines.length > 0) {
      await prisma.restaurantCuisine.createMany({
        data: cuisines.map((c) => ({
          restaurantId: restaurant.id,
          cuisineId: c.id,
        })),
      });
    }

    // Refresh Menu
    let category = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id, name: 'Popular Items' },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          tenantId,
          restaurantId: restaurant.id,
          name: 'Popular Items',
          displayOrder: 1,
          isActive: true,
        },
      });
    }

    await prisma.menuItem.deleteMany({
      where: { categoryId: category.id },
    });

    const itemName1 = restaurantName.includes('Momo') ? 'Buff Momo' : (restaurantName.includes('Newari') ? 'Choila' : 'Cheese Burger');
    const itemName2 = restaurantName.includes('Momo') ? 'Veg Momo' : (restaurantName.includes('Newari') ? 'Bara' : 'Veg Burger');

    await prisma.menuItem.createMany({
      data: [
        {
          tenantId,
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: itemName1,
          description: 'Freshly made and delicious',
          price: itemName1.includes('Momo') ? 150 : (itemName1.includes('Choila') ? 250 : 350),
          isAvailable: true,
          isVegetarian: false,
        },
        {
          tenantId,
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: itemName2,
          description: 'A great vegetarian option',
          price: itemName2.includes('Momo') ? 120 : (itemName2.includes('Bara') ? 150 : 250),
          isAvailable: true,
          isVegetarian: true,
        },
      ],
    });

    console.log(`✅ Created/Updated: ${restaurantName} (${ownerEmail})`);
  }

  // =========================================================
  // 4. CREATE RESTAURANT SCENARIOS
  // =========================================================
  console.log('🔹 Setting up Restaurants & Tenants...');
  
  await createRestaurantScenario(
    'Momo Tenants', 'owner1@test.com', 'Ramesh Shrestha',
    "Momo's & More", 'momos-and-more', 'Kathmandu', 27.7172, 85.3240,
    ['Nepali', 'Fast Food'],
    true // GRANTS SUBSCRIPTION
  );

  await createRestaurantScenario(
    'Newari Tenants', 'owner2@test.com', 'Sita Maharjan',
    'Newari Bhanchha Ghar', 'newari-bhanchha-ghar', 'Patan', 27.6766, 85.3253,
    ['Newari', 'Nepali'],
    false
  );

  await createRestaurantScenario(
    'Burger Tenants', 'owner3@test.com', 'John Doe',
    'Burger Station', 'burger-station', 'Kathmandu', 27.7000, 85.3100,
    ['Fast Food', 'Chinese'],
    false
  );

  // =========================================================
  // 5. CREATE TEST CUSTOMER
  // =========================================================
  console.log('🔹 Setting up Test Customer...');
  const customerPassword = await bcrypt.hash('password123', SALT_ROUNDS);
  await prisma.customer.upsert({
    where: { email: 'customer@test.com' },
    update: { name: 'Test Customer', passwordHash: customerPassword },
    create: {
      name: 'Test Customer',
      email: 'customer@test.com',
      passwordHash: customerPassword,
      isGuest: false,
    },
  });

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test Accounts:');
  console.log(`  Platform Admin: ${bootstrapEmail} (Password: ${bootstrapPassword})`);
  console.log('  Owner 1 (WITH SUBSCRIPTION): owner1@test.com (Password: password123)');
  console.log('  Owner 2 (NO SUBSCRIPTION):   owner2@test.com (Password: password123)');
  console.log('  Owner 3 (NO SUBSCRIPTION):   owner3@test.com (Password: password123)');
  console.log('  Customer:                    customer@test.com (Password: password123)');
}



main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });