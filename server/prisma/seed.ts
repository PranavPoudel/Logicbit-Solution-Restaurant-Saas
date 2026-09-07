import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. MASTER CUISINES
  console.log('🍕 Seeding Master Cuisines...');
  const cuisineNames = ['Nepali', 'Newari', 'Fast Food', 'Chinese', 'Desserts', 'Indian'];
  for (const name of cuisineNames) {
    await prisma.cuisine.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(' ', '-'), isActive: true },
    });
  }

  // 2. PLATFORM ADMIN & PERMISSIONS SETUP
  console.log('👑 Seeding Platform Admin Role, Staff & Permissions...');
  const adminRole = await prisma.platformRole.upsert({
    where: { name: 'Full Admin' },
    update: {},
    create: { name: 'Full Admin', description: 'Full Platform Admin Role' },
  });

  const bootstrapEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@logicbit.local';
  const bootstrapPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'Admin@123';
  const adminPassword = await bcrypt.hash(bootstrapPassword, SALT_ROUNDS);

  await prisma.platformStaff.upsert({
    where: { email: bootstrapEmail },
    update: { name: 'Platform Owner', passwordHash: adminPassword, roleId: adminRole.id },
    create: {
      name: 'Platform Owner',
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
    'MANAGE_ADVERTISEMENTS', 'MANAGE_CUISINES', 'VIEW_DELIVERIES',
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

  // 3. SUBSCRIPTION PLANS
  console.log('💳 Seeding Subscription Plans...');
  const plans = [
    { name: 'Free Tier', durationMonths: 1, price: 0 },
    { name: 'Basic Monthly', durationMonths: 1, price: 2999 },
    { name: 'Pro Plan', durationMonths: 12, price: 5999 },
    { name: 'Basic Annual', durationMonths: 12, price: 29990 },
    { name: 'Pro Annual', durationMonths: 12, price: 59990 },
    { name: 'Lifetime Access', durationMonths: 0, price: 150000 },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  // Helper function to create/update a full restaurant scenario
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

    if (hasSubscription) {
      let plan = await prisma.subscriptionPlan.findUnique({ where: { name: 'Pro Plan' } });
      if (!plan) {
        plan = await prisma.subscriptionPlan.create({
          data: {
            name: 'Pro Plan',
            durationMonths: 12,
            price: 5999,
            isActive: true,
          },
        });
      }

      await prisma.restaurantSubscription.upsert({
        where: { restaurantId: restaurant.id },
        update: {
          planId: plan.id,
          status: 'ACTIVE',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true,
        },
        create: {
          restaurantId: restaurant.id,
          planId: plan.id,
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

  // 4. RESTAURANT SCENARIOS
  console.log('🏪 Seeding Restaurants...');
  await createRestaurantScenario(
    'Momo Tenants', 'owner1@test.com', 'Ramesh Shrestha',
    "Momo's & More", 'momos-and-more', 'Kathmandu', 27.7172, 85.3240,
    ['Nepali', 'Fast Food'],
    true
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

  // 5. TEST CUSTOMER
  console.log('👤 Seeding Test Customer...');
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

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test Accounts (Password for all is: password123):');
  console.log(`  Platform Admin: ${bootstrapEmail}`);
  console.log('  Owner 1 (WITH SUBSCRIPTION): owner1@test.com');
  console.log('  Owner 2 (NO SUBSCRIPTION):   owner2@test.com');
  console.log('  Owner 3 (NO SUBSCRIPTION):   owner3@test.com');
  console.log('  Customer:                    customer@test.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });