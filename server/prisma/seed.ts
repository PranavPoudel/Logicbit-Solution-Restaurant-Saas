import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Master Cuisines
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
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@logicbit.local',
      passwordHash: adminPassword,
      roleId: 'super_admin', // Adjust if your role ID is different
    },
  });

  // Helper function to create a full restaurant scenario
  async function createRestaurantScenario(
    tenantName: string,
    ownerEmail: string,
    ownerName: string,
    restaurantName: string,
    slug: string,
    city: string,
    lat: number,
    lng: number,
    cuisineNamesToLink: string[]
  ) {
    const password = await bcrypt.hash('password123', 10);
    
    // Create Tenant
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });

    // Create Owner User
    const owner = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: ownerName,
        email: ownerEmail,
        passwordHash: password,
        isSuperAdmin: true, // Owner is the super admin of their own tenant
      },
    });

    // Create Restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        tenantId: tenant.id,
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

    // Link Cuisines
    const cuisines = await prisma.cuisine.findMany({
      where: { name: { in: cuisineNamesToLink } },
    });
    await prisma.restaurantCuisine.createMany({
      data: cuisines.map((c) => ({
        restaurantId: restaurant.id,
        cuisineId: c.id,
      })),
    });

    // Create a Category
    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        name: 'Popular Items',
        displayOrder: 1,
        isActive: true,
      },
    });

    // Create Menu Items
    const itemName1 = restaurantName.includes('Momo') ? 'Buff Momo' : (restaurantName.includes('Newari') ? 'Choila' : 'Cheese Burger');
    const itemName2 = restaurantName.includes('Momo') ? 'Veg Momo' : (restaurantName.includes('Newari') ? 'Bara' : 'Veg Burger');
    
    await prisma.menuItem.createMany({
      data: [
        {
          tenantId: tenant.id,
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: itemName1,
          description: 'Freshly made and delicious',
          price: itemName1.includes('Momo') ? 150 : (itemName1.includes('Choila') ? 250 : 350),
          isAvailable: true,
          isVegetarian: false,
        },
        {
          tenantId: tenant.id,
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

    console.log(`✅ Created: ${restaurantName} (${ownerEmail})`);
  }

  // 3. Create 3 Distinct Restaurant Scenarios
  await createRestaurantScenario(
    'Momo Tenants', 'owner1@test.com', 'Ramesh Shrestha', 
    'Momo\'s & More', 'momos-and-more', 'Kathmandu', 27.7172, 85.3240, 
    ['Nepali', 'Fast Food']
  );

  await createRestaurantScenario(
    'Newari Tenants', 'owner2@test.com', 'Sita Maharjan', 
    'Newari Bhanchha Ghar', 'newari-bhanchha-ghar', 'Patan', 27.6766, 85.3253, 
    ['Newari', 'Nepali']
  );

  await createRestaurantScenario(
    'Burger Tenants', 'owner3@test.com', 'John Doe', 
    'Burger Station', 'burger-station', 'Kathmandu', 27.7000, 85.3100, 
    ['Fast Food', 'Chinese']
  );

  // 4. Create a Test Customer
  const customerPassword = await bcrypt.hash('password123', 10);
  await prisma.customer.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@test.com',
      passwordHash: customerPassword,
      isGuest: false,
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test Accounts:');
  console.log('  Platform Admin: admin@logicbit.local / ChangeMe123!');
  console.log('  Owner 1:        owner1@test.com / password123');
  console.log('  Owner 2:        owner2@test.com / password123');
  console.log('  Owner 3:        owner3@test.com / password123');
  console.log('  Customer:       customer@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });