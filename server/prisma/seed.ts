import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Master Cuisines (Upsert to avoid duplicates)
  const cuisineNames = ['Nepali', 'Newari', 'Fast Food', 'Chinese', 'Desserts', 'Indian'];
  for (const name of cuisineNames) {
    await prisma.cuisine.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(' ', '-'), isActive: true },
    });
  }

  // 2. Create Platform Admin
  const adminPassword = await bcrypt.hash('ChangeMe123!', 10);
  await prisma.platformStaff.upsert({
    where: { email: 'admin@logicbit.local' },
    update: { name: 'Super Admin', passwordHash: adminPassword },
    create: {
      name: 'Super Admin',
      email: 'admin@logicbit.local',
      passwordHash: adminPassword,
      roleId: 'super_admin', // Adjust if your actual role ID is different
    },
  });

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
    hasSubscription: boolean = false // ✅ NEW: Flag to grant subscription
  ) {
    const password = await bcrypt.hash('password123', 10);
    
    // Find existing user to get tenantId, or create a new tenant
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    let tenantId = existingUser?.tenantId;

    if (!tenantId) {
      const tenant = await prisma.tenant.create({ data: { name: tenantName } });
      tenantId = tenant.id;
    }

    // Create or Update Owner User
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

    // Create or Update Restaurant
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

    // ✅ NEW: Add Subscription if requested
    if (hasSubscription) {
      // Ensure a Pro Plan exists
      let plan = await prisma.subscriptionPlan.findUnique({ where: { name: 'Pro Plan' } });
      if (!plan) {
        plan = await prisma.subscriptionPlan.create({
          data: {
            name: 'Pro Plan',
            durationMonths: 12,
            price: 2999,
            isActive: true,
          },
        });
      }

      // Create or update the subscription for this restaurant
      await prisma.restaurantSubscription.upsert({
        where: { restaurantId: restaurant.id },
        update: {
          planId: plan.id,
          status: 'ACTIVE',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
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
      console.log(`   ↳ ✅ Added ACTIVE Pro Plan subscription`);
    }

    // Refresh Cuisines (Delete old links, create new ones to avoid duplicates)
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

    // Refresh Menu (Delete old items in this category, create new ones)
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

  // 3. Create 3 Distinct Restaurant Scenarios
  // ✅ We pass 'true' as the last argument to give owner1 a subscription!
  await createRestaurantScenario(
    'Momo Tenants', 'owner1@test.com', 'Ramesh Shrestha', 
    'Momo\'s & More', 'momos-and-more', 'Kathmandu', 27.7172, 85.3240, 
    ['Nepali', 'Fast Food'],
    true // <--- GRANTS SUBSCRIPTION
  );

  await createRestaurantScenario(
    'Newari Tenants', 'owner2@test.com', 'Sita Maharjan', 
    'Newari Bhanchha Ghar', 'newari-bhanchha-ghar', 'Patan', 27.6766, 85.3253, 
    ['Newari', 'Nepali'],
    false // No subscription
  );

  await createRestaurantScenario(
    'Burger Tenants', 'owner3@test.com', 'John Doe', 
    'Burger Station', 'burger-station', 'Kathmandu', 27.7000, 85.3100, 
    ['Fast Food', 'Chinese'],
    false // No subscription
  );

  // 4. Create a Test Customer
  const customerPassword = await bcrypt.hash('password123', 10);
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
  console.log('  Platform Admin: admin@logicbit.local');
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