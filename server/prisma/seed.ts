import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed...');

  // Wrap the entire seed in an interactive transaction
  await prisma.$transaction(async (tx) => {
    
    // 1. PLATFORM ADMIN & ROLE SETUP
    console.log('👑 Seeding Platform Admin Role & User...');
    
    const adminRole = await tx.platformRole.upsert({
      where: { name: 'Full Admin' },
      update: {},
      create: { name: 'Full Admin' },
    });

    const bootstrapEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@logicbit.local';
    const bootstrapPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'Admin@123';
    const adminPassword = await bcrypt.hash(bootstrapPassword, SALT_ROUNDS);

    await tx.platformStaff.upsert({
      where: { email: bootstrapEmail },
      update: {},
      create: {
        name: 'Platform Owner',
        email: bootstrapEmail,
        passwordHash: adminPassword,
        roleId: adminRole.id,
      },
    });

    // 2. ASSIGN ALL PERMISSIONS TO ADMIN ROLE
    console.log('🔑 Assigning Platform Permissions...');
    const allPermissions = await tx.platformPermission.findMany();

    for (const permission of allPermissions) {
      await tx.platformRolePermission.upsert({
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

    // 3. TENANT & RESTAURANT OWNER SETUP
    console.log('🏪 Seeding Restaurant Tenant & Owner...');
    const ownerPassword = await bcrypt.hash('owner123', SALT_ROUNDS);

    const tenant = await tx.tenant.upsert({
      where: { id: 'seed-tenant-id' },
      update: {},
      create: { id: 'seed-tenant-id', name: 'Kathmandu Eats Tenant' },
    });

    const owner = await tx.user.upsert({
      where: { email: 'owner@restaurant.com' },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Restaurant Owner',
        email: 'owner@restaurant.com',
        phone: '9841000001',
        passwordHash: ownerPassword,
        isSuperAdmin: true,
      },
    });

    const ownerRole = await tx.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'OWNER' } },
      update: {},
      create: { tenantId: tenant.id, name: 'OWNER' },
    });

    await tx.userRole.upsert({
      where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
      update: {},
      create: { userId: owner.id, roleId: ownerRole.id },
    });

    const restaurant = await tx.restaurant.upsert({
      where: { slug: 'momos-and-more' },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Momos & More',
        slug: 'momos-and-more',
        address: 'Thamel, Kathmandu',
        city: 'Kathmandu',
        latitude: 27.7172,
        longitude: 85.3240,
        isOpen: true,
        supportsDelivery: true,
        supportsPickup: true,
        selfDeliveryRadiusKm: 3,
        maxDeliveryRadiusKm: 10,
        platformCommissionPercent: 10,
      },
    });

    // 4. MENU SETUP (Cuisines, Categories, Items)
    console.log('🍔 Seeding Menu Data...');

    const cuisine = await tx.cuisine.upsert({
      where: { slug: 'nepali' },
      update: {},
      create: { name: 'Nepali', slug: 'nepali' },
    });

    await tx.restaurantCuisine.upsert({
      where: { restaurantId_cuisineId: { restaurantId: restaurant.id, cuisineId: cuisine.id } },
      update: {},
      create: { restaurantId: restaurant.id, cuisineId: cuisine.id },
    });

    const category = await tx.category.upsert({
      where: { id: 'seed-cat-1' },
      update: {},
      create: { 
        tenantId: tenant.id, 
        restaurantId: restaurant.id, 
        name: 'Momos', 
        displayOrder: 1 
      },
    });

    const item1 = await tx.menuItem.upsert({
      where: { id: 'seed-item-1' },
      update: {},
      create: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Buff Momo (Steam)',
        price: 120,
        isAvailable: true,
        isVegetarian: false,
      },
    });

    const item2 = await tx.menuItem.upsert({
      where: { id: 'seed-item-2' },
      update: {},
      create: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Veg Momo (Steam)',
        price: 100,
        isAvailable: true,
        isVegetarian: true,
      },
    });

    // 5. CUSTOMER & ORDER SETUP
    console.log('👤 Seeding Customer & Sample Order...');
    const customerPassword = await bcrypt.hash('user1234', SALT_ROUNDS);

    const customer = await tx.customer.upsert({
      where: { email: 'user@customer.com' },
      update: {},
      create: {
        name: 'Customer User',
        email: 'user@customer.com',
        phone: '9841000002',
        passwordHash: customerPassword,
      },
    });

    const order = await tx.order.create({
      data: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        customerId: customer.id,
        orderNumber: 'ORD-0001',
        status: 'COMPLETED', 
        orderType: 'DELIVERY',
        subtotal: 220,
        deliveryFee: 50,
        tax: 0,
        total: 270,
        paymentStatus: 'PAID',
        paymentMethod: 'COD',
        deliveryAddress: 'Durbar Marg, Kathmandu',
        deliveryLatitude: 27.7000,
        deliveryLongitude: 85.3200,
        items: {
          create: [
            { menuItemId: item1.id, quantity: 1, unitPrice: 120, subtotal: 120 },
            { menuItemId: item2.id, quantity: 1, unitPrice: 100, subtotal: 100 },
          ],
        },
      },
    });

    await tx.review.create({
      data: {
        restaurantId: restaurant.id,
        customerId: customer.id,
        orderId: order.id,
        rating: 5,
        comment: 'The buff momos were amazing! Fast delivery too.',
      },
    });

    await tx.coupon.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'WELCOME20' } },
      update: {},
      create: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        code: 'WELCOME20',
        type: 'PERCENTAGE',
        value: 20,
        maxDiscount: 100,
        minOrderAmount: 500,
        usageLimit: 100,
        isActive: true,
      },
    });

    // 6. SUBSCRIPTION PLANS
    console.log('💳 Seeding Subscription Plans...');
    const plans = [
      { name: 'Free Tier', durationMonths: 1, price: 0 },
      { name: 'Basic Monthly', durationMonths: 1, price: 2999 },
      { name: 'Pro Monthly', durationMonths: 1, price: 5999 },
      { name: 'Basic Annual', durationMonths: 12, price: 29990 },
      { name: 'Pro Annual', durationMonths: 12, price: 59990 },
      { name: 'Lifetime Access', durationMonths: 0, price: 150000 },
    ];

    for (const plan of plans) {
      await tx.subscriptionPlan.upsert({
        where: { name: plan.name },
        update: {},
        create: plan,
      });
    }

    console.log('✅ Database seeding completed successfully!');
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });