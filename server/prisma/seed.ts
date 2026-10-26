import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// =========================================================
// MOCK DATA POOLS
// =========================================================
const CITIES = [
  { name: 'Kathmandu', lat: 27.7172, lng: 85.3240 },
  { name: 'Patan', lat: 27.6766, lng: 85.3253 },
  { name: 'Bhaktapur', lat: 27.6710, lng: 85.4298 },
  { name: 'Budhanilkantha', lat: 27.7789, lng: 85.3606 },
  { name: 'Baneshwor', lat: 27.6915, lng: 85.3430 },
];

const RESTAURANT_NAMES = [
  "Momo's & More", 'Newari Bhanchha Ghar', 'Burger Station', 'Himalayan Java Clone',
  'Thakali Kitchen', 'Sushi Sano', 'Pizza Hub Nepal', 'Chatamari Corner',
  'Buff & Brew', 'Vegan Vibes KTM', 'Spice Route Indian', 'Dragon Wok Chinese',
  'The Coffee Bean KTM', 'Sel Roti House', 'Kathmandu Grill', 'Pokhara Thakali',
  'Jhol Momo Factory', 'Sweet Tooth Bakery', 'The Local Pub', 'Organic Harvest'
];

const CATEGORIES = ['Starters', 'Main Course', 'Drinks', 'Desserts', 'Chef Specials', 'Combos'];

const ITEM_NAMES = [
  'Buff Momo', 'Veg Momo', 'Chicken Chowmein', 'Buff Sekuwa', 'Thakali Khana Set',
  'Margherita Pizza', 'Chicken Burger', 'Veg Spring Roll', 'Fresh Lime Juice',
  'Chocolate Brownie', 'Masala Tea', 'Cold Coffee', 'Paneer Tikka', 'Chicken Wings',
  'Mushroom Soup', 'Garlic Bread', 'Fried Rice', 'Chilli Chicken', 'Sel Roti',
  'Juju Dhau', 'Samosa', 'Aloo Chop', 'Chicken Sekuwa', 'Veg Sandwich'
];

const DELIVERY_PARTNER_NAMES = ['Pathao Foods', 'InDrive Delivery', 'Local Rider', 'Restaurant Own Fleet'];

// Helper functions
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// =========================================================
// HELPER: CLEAR DATABASE
// =========================================================
async function clearDatabase() {
  console.log('🧹 Clearing existing database data (TRUNCATE CASCADE)...');
  try {
    // 1. Get all table names in the public schema
    const tables = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    // 2. Filter out Prisma's migration tracking table
    const tableNames = tables
      .map((t) => t.tablename)
      .filter((name) => name !== '_prisma_migrations');

    if (tableNames.length > 0) {
      // 3. Format table names with schema prefix
      const tablesStr = tableNames.map((name) => `"public"."${name}"`).join(', ');
      
      // 4. Execute TRUNCATE with CASCADE (automatically handles foreign key dependencies)
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
  console.log('🌱 Starting database seed with realistic data volume...');

  // 0. CLEAR EXISTING DATA
  await clearDatabase();

  // 1. PLATFORM ROLES, STAFF & PERMISSIONS
  console.log('🔹 Setting up Platform Roles, Staff & Permissions...');
  const adminRole = await prisma.platformRole.create({
    data: { name: 'Super Admin' },
  });

  const bootstrapEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@logicbit.local';
  const bootstrapPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminPassword = await bcrypt.hash(bootstrapPassword, SALT_ROUNDS);

  await prisma.platformStaff.create({
    data: { name: 'Super Admin', email: bootstrapEmail, passwordHash: adminPassword, roleId: adminRole.id },
  });

  const requiredPermissions = [
    'VIEW_REVENUE', 'VIEW_RESTAURANTS', 'OVERRIDE_RESTAURANT_SETTINGS',
    'SUSPEND_RESTAURANT', 'MANAGE_COMMISSION', 'MODERATE_CONTENT',
    'MANAGE_PLATFORM_STAFF', 'MANAGE_SETTLEMENTS', 'MANAGE_SUBSCRIPTIONS',
    'MANAGE_ADVERTISEMENTS', 'MANAGE_CUISINES', 'MANAGE_CITIES', 'VIEW_DELIVERIES',
    'VIEW_ACTIVITY_LOGS', 'PROCESS_REFUNDS',
  ];

  for (const perm of requiredPermissions) {
    await prisma.platformPermission.create({
      data: { name: perm, description: `Allows ${perm.toLowerCase().replace(/_/g, ' ')}` },
    });
  }

  const allPermissions = await prisma.platformPermission.findMany();
  await prisma.platformRolePermission.createMany({ 
    data: allPermissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })), 
  });

  // 2. MASTER DATA
  console.log('🔹 Setting up Master Data...');
  const cuisineNames = ['Nepali', 'Newari', 'Fast Food', 'Chinese', 'Desserts', 'Indian', 'Italian', 'Japanese'];
  for (const name of cuisineNames) {
    await prisma.cuisine.create({
      data: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), isActive: true },
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
    await prisma.subscriptionPlan.create({ data: plan });
  }

  const proPlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'Pro Plan' } });
  const allCuisines = await prisma.cuisine.findMany();
  const password = await bcrypt.hash('password123', SALT_ROUNDS);

  // 3. GENERATE 20 RESTAURANTS WITH FULL ECOSYSTEM
  console.log('🔹 Generating 20 Restaurants with Menu, Modifiers, Coupons, Delivery, Storefront & Ads...');
  
  for (let i = 0; i < 20; i++) {
    const city = randomChoice(CITIES);
    const lat = city.lat + (Math.random() - 0.5) * 0.05;
    const lng = city.lng + (Math.random() - 0.5) * 0.05;
    
    const restName = RESTAURANT_NAMES[i];
    const slug = `${restName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
    const ownerEmail = `owner${i + 1}@test.com`;
    const tenantName = `${restName} Tenant`;

    console.log(`   🏪 Seeding ${i + 1}/20: ${restName}...`);

    // A. Tenant & Owner
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    await prisma.user.create({
      data: { tenantId: tenant.id, name: `Owner ${i + 1}`, email: ownerEmail, passwordHash: password, isSuperAdmin: true },
    });

    // B. Restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        tenantId: tenant.id, name: restName, slug, latitude: lat, longitude: lng,
        address: `${randomInt(1, 99)} Main Street, ${city.name}`, city: city.name, country: 'Nepal',
        isOpen: true, supportsDelivery: true, supportsPickup: true, supportsDineIn: Math.random() > 0.3,
        selfDeliveryRadiusKm: randomInt(3, 7), maxDeliveryRadiusKm: randomInt(8, 15),
        selfDeliveryFlatFee: randomInt(50, 100), platformCommissionPercent: randomInt(8, 15),
        primaryColor: '#E3A008', secondaryColor: '#17181C',
      },
    });

    // C. Subscription (50% chance)
    if (proPlan && Math.random() > 0.5) {
      await prisma.restaurantSubscription.create({
        data: { restaurantId: restaurant.id, planId: proPlan.id, status: 'ACTIVE', startDate: new Date(), expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), autoRenew: true },
      });
    }

    // D. Cuisines
    const shuffledCuisines = [...allCuisines].sort(() => 0.5 - Math.random()).slice(0, randomInt(1, 3));
    await prisma.restaurantCuisine.createMany({
      data: shuffledCuisines.map((c) => ({ restaurantId: restaurant.id, cuisineId: c.id })),
    });

    // E. Categories
    const activeCategories = CATEGORIES.slice(0, randomInt(4, 6));
    const createdCategories = await Promise.all(
      activeCategories.map((catName, idx) =>
        prisma.category.create({
          data: { tenantId: tenant.id, restaurantId: restaurant.id, name: catName, displayOrder: idx, isActive: true },
        })
      )
    );

    // F. Menu Items (80-120)
    const numItems = randomInt(80, 120);
    const menuItemsData: Prisma.MenuItemCreateManyInput[] = [];
    for (let j = 0; j < numItems; j++) {
      const baseName = randomChoice(ITEM_NAMES);
      const category = randomChoice(createdCategories);
      const isVeg = Math.random() > 0.6;
      menuItemsData.push({
        tenantId: tenant.id, restaurantId: restaurant.id, categoryId: category.id,
        name: `${baseName} ${randomInt(1, 99)}`,
        nameJa: Math.random() > 0.8 ? `${baseName} (JP)` : undefined,
        description: `Delicious ${baseName.toLowerCase()} prepared with fresh ingredients.`,
        price: randomFloat(100, 1500), costPrice: randomFloat(50, 800),
        isAvailable: Math.random() > 0.1, isVegetarian: isVeg, isVegan: isVeg && Math.random() > 0.5,
        spiceLevel: randomChoice(['MILD', 'MEDIUM', 'HOT', null]) as any,
        calories: randomInt(200, 800), preparationTimeMinutes: randomInt(10, 45), displayOrder: j,
      });
    }
    await prisma.menuItem.createMany({ data: menuItemsData });

    // G. MODIFIER GROUPS & OPTIONS
    const modifierGroupsData: Prisma.ModifierGroupCreateManyInput[] = [
      { tenantId: tenant.id, restaurantId: restaurant.id, name: 'Spice Level', minSelect: 0, maxSelect: 1, isRequired: false, displayOrder: 1 },
      { tenantId: tenant.id, restaurantId: restaurant.id, name: 'Extra Add-ons', minSelect: 0, maxSelect: 3, isRequired: false, displayOrder: 2 },
      { tenantId: tenant.id, restaurantId: restaurant.id, name: 'Portion Size', minSelect: 1, maxSelect: 1, isRequired: true, displayOrder: 3 },
    ];
    await prisma.modifierGroup.createMany({ data: modifierGroupsData });

    const createdGroups = await prisma.modifierGroup.findMany({ where: { restaurantId: restaurant.id } });
    const modifierOptionsData: Prisma.ModifierOptionCreateManyInput[] = [];

    for (const group of createdGroups) {
      if (group.name === 'Spice Level') {
        ['Mild', 'Medium', 'Hot', 'Extra Hot (+Rs. 20)'].forEach((opt, idx) => {
          modifierOptionsData.push({ tenantId: tenant.id, modifierGroupId: group.id, name: opt, extraPrice: idx === 3 ? 20 : 0, isAvailable: true, displayOrder: idx });
        });
      } else if (group.name === 'Extra Add-ons') {
        [{n: 'Extra Cheese', p: 40}, {n: 'Extra Meat', p: 80}, {n: 'No Onion/Garlic', p: 0}].forEach((opt, idx) => {
          modifierOptionsData.push({ tenantId: tenant.id, modifierGroupId: group.id, name: opt.n, extraPrice: opt.p, isAvailable: true, displayOrder: idx });
        });
      } else if (group.name === 'Portion Size') {
        [{n: 'Regular', p: 0}, {n: 'Large (+Rs. 100)', p: 100}].forEach((opt, idx) => {
          modifierOptionsData.push({ tenantId: tenant.id, modifierGroupId: group.id, name: opt.n, extraPrice: opt.p, isAvailable: true, displayOrder: idx });
        });
      }
    }
    await prisma.modifierOption.createMany({ data: modifierOptionsData });

    const allMenuItems = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id }, select: { id: true } });
    const menuItemModifierLinks: Prisma.MenuItemModifierGroupCreateManyInput[] = [];
    for (const item of allMenuItems) {
      if (Math.random() > 0.6) {
        const numGroups = randomInt(1, 2);
        const shuffledGroups = [...createdGroups].sort(() => 0.5 - Math.random()).slice(0, numGroups);
        for (const group of shuffledGroups) {
          menuItemModifierLinks.push({ menuItemId: item.id, modifierGroupId: group.id });
        }
      }
    }
    if (menuItemModifierLinks.length > 0) {
      await prisma.menuItemModifierGroup.createMany({ data: menuItemModifierLinks });
    }

    // H. COUPONS
    const couponsData: Prisma.CouponCreateManyInput[] = [
      {
        tenantId: tenant.id, restaurantId: restaurant.id, code: `WELCOME${randomInt(10, 99)}`,
        type: 'PERCENTAGE', value: randomInt(10, 20), maxDiscount: 200, minOrderAmount: 500,
        usageLimit: 100, usageLimitPerCustomer: 1, usedCount: 0, validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), isActive: true, isAutoApply: false,
      },
      {
        tenantId: tenant.id, restaurantId: restaurant.id, code: `FLAT${randomInt(50, 150)}`,
        type: 'FLAT', value: randomInt(50, 150), minOrderAmount: 1000,
        usageLimit: 50, usageLimitPerCustomer: 1, usedCount: 0, validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), isActive: true, isAutoApply: true,
      },
      {
        tenantId: tenant.id, restaurantId: restaurant.id, code: `FREESHIP${randomInt(10, 99)}`,
        type: 'FLAT', value: 100, minOrderAmount: 800,
        usageLimit: 200, usageLimitPerCustomer: 3, usedCount: randomInt(5, 20), validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true, isAutoApply: false,
      }
    ];
    await prisma.coupon.createMany({ data: couponsData });

    // I. DELIVERY PARTNERS
    const numPartners = randomInt(1, 3);
    const selectedPartners = [...DELIVERY_PARTNER_NAMES].sort(() => 0.5 - Math.random()).slice(0, numPartners);
    const deliveryPartnersData: Prisma.DeliveryPartnerCreateManyInput[] = selectedPartners.map((name) => ({
      tenantId: tenant.id, restaurantId: restaurant.id, name: name,
      contactName: `Manager ${name}`, contactPhone: `98${randomInt(10000000, 99999999)}`,
      feeType: randomChoice(['FLAT', 'PERCENT']),
      feeValue: randomChoice(['FLAT', 'PERCENT']) === 'FLAT' ? randomInt(30, 80) : randomFloat(10, 20),
      notes: 'Standard agreement', isActive: true,
    }));
    await prisma.deliveryPartner.createMany({ data: deliveryPartnersData });

    // J. ADVERTISEMENTS
    const adsData: Prisma.AdvertisementCreateManyInput[] = [
      {
        tenantId: tenant.id, restaurantId: restaurant.id,
        placementType: 'HOMEPAGE_BANNER', title: `Grand Opening of ${restName}!`,
        imageUrl: `https://picsum.photos/seed/${slug}-ad1/800/400`, linkUrl: `/restaurant/${slug}`,
        startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amountPaid: randomInt(5000, 20000), priority: randomInt(1, 10),
        status: Math.random() > 0.3 ? 'ACTIVE' : 'PENDING',
      },
      {
        tenantId: tenant.id, restaurantId: restaurant.id,
        placementType: 'SEARCH_BOOST', title: `Top Rated ${randomChoice(cuisineNames)} in ${city.name}`,
        imageUrl: `https://picsum.photos/seed/${slug}-ad2/400/400`, linkUrl: `/restaurant/${slug}`,
        startDate: new Date(), endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        amountPaid: randomInt(2000, 10000), priority: randomInt(1, 5),
        status: 'ACTIVE',
      }
    ];
    await prisma.advertisement.createMany({ data: adsData });

    // K. STOREFRONT CONFIGURATION
    await prisma.storefrontConfig.create({
      data: {
        tenantId: tenant.id, restaurantId: restaurant.id,
        aboutText: `Welcome to ${restName}, the best place for authentic ${randomChoice(cuisineNames)} food in ${city.name}. We use fresh, local ingredients to bring you unforgettable flavors.`,
        contactPhone: `98${randomInt(10000000, 99999999)}`,
        contactEmail: `hello@${slug}.com`,
        contactAddress: `${randomInt(1, 99)} Main Street, ${city.name}`,
        socialLinks: { facebook: '#', instagram: '#', twitter: '#' },
        sectionSettings: [
          { id: 'banner', isVisible: true, titleEn: 'Welcome', titleJa: 'ようこそ' },
          { id: 'menu', isVisible: true, titleEn: 'Our Menu', titleJa: 'メニュー' },
          { id: 'about', isVisible: true, titleEn: 'About Us', titleJa: '私たちについて' },
          { id: 'contact', isVisible: true, titleEn: 'Contact', titleJa: 'お問い合わせ' }
        ]
      }
    });

    // L. STOREFRONT BANNERS
    const bannersData: Prisma.StorefrontBannerCreateManyInput[] = Array.from({ length: randomInt(2, 4) }).map((_, idx) => ({
      tenantId: tenant.id, restaurantId: restaurant.id,
      imageUrl: `https://picsum.photos/seed/${slug}-banner${idx}/1200/400`,
      title: `Special Offer ${idx + 1} at ${restName}`,
      subtitle: 'Delicious food delivered fast!',
      linkUrl: `/restaurant/${slug}`,
      displayOrder: idx, isActive: true,
    }));
    await prisma.storefrontBanner.createMany({ data: bannersData });

    // M. STOREFRONT POPUPS
    if (Math.random() > 0.5) {
      await prisma.storefrontPopup.create({
        data: {
          tenantId: tenant.id, restaurantId: restaurant.id,
          title: 'Welcome!', message: 'Get 10% off your first order with code WELCOME10',
          imageUrl: `https://picsum.photos/seed/${slug}-popup/600/400`,
          ctaText: 'Order Now', ctaLink: `/restaurant/${slug}`,
          type: 'DISCOUNT',
          startDate: new Date(), endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true,
        }
      });
    }
  }

  // 4. CREATE TEST CUSTOMERS & MOCK ORDERS/REVIEWS
  console.log('🔹 Setting up Test Customers and Mock Orders/Reviews...');
  const customerPassword = await bcrypt.hash('password123', SALT_ROUNDS);
  
  const customer = await prisma.customer.create({
    data: { name: 'Test Customer', email: 'customer@test.com', passwordHash: customerPassword, isGuest: false },
  });

  const restaurants = await prisma.restaurant.findMany({ select: { id: true, tenantId: true } });
  
  for (const rest of restaurants) {
    // Reviews
    await prisma.review.createMany({
      data: Array.from({ length: randomInt(2, 8) }).map(() => ({
        restaurantId: rest.id, customerId: customer.id,
        rating: randomInt(3, 5),
        comment: randomChoice(['Delicious!', 'Good packaging', 'Fast delivery', 'Highly recommended']),
      })),
    });

    // 1-2 Mock Orders per restaurant
    const orderCount = randomInt(1, 2);
    for (let o = 0; o < orderCount; o++) {
      const subtotal = randomFloat(500, 2500);
      const deliveryFee = randomFloat(50, 150);
      const total = subtotal + deliveryFee;
      const commission = total * 0.10;

      const order = await prisma.order.create({
        data: {
          tenantId: rest.tenantId, restaurantId: rest.id, customerId: customer.id,
          orderNumber: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
          status: randomChoice(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED']) as any,
          orderType: randomChoice(['DELIVERY', 'PICKUP', 'DINE_IN']) as any,
          subtotal, deliveryFee, tax: 0, discountAmount: 0, total, platformCommissionAmount: commission,
          paymentStatus: 'PAID', paymentMethod: 'COD',
          deliveryAddress: 'Test Address, Kathmandu', deliveryDistanceKm: randomFloat(1, 5), deliveryHandledBy: 'SELF_DELIVERY',
        },
      });

      const menuItems = await prisma.menuItem.findMany({ where: { restaurantId: rest.id }, take: 3, select: { id: true, price: true } });
      const orderItemsData = menuItems.map((item) => {
        const qty = randomInt(1, 3);
        return {
          orderId: order.id, 
          menuItemId: item.id, 
          quantity: qty,
          unitPrice: item.price, 
          subtotal: item.price * qty,
          selectedModifiers: Math.random() > 0.5 
            ? [{ name: 'Extra Cheese', extraPrice: 40 }] 
            : Prisma.JsonNull, 
        };
      });

      await prisma.orderItem.createMany({ data: orderItemsData });
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test Accounts:');
  console.log(`  Platform Admin: ${bootstrapEmail} (Password: ${bootstrapPassword})`);
  console.log('  Customer:       customer@test.com (Password: password123)');
  console.log('  Owners:         owner1@test.com to owner20@test.com (Password: password123)');
  console.log('\n📊 Data Volume Summary:');
  console.log('  - 20 Tenants & Restaurant Owners');
  console.log('  - 20 Restaurants with varied locations & settings');
  console.log('  - ~2,000 Menu Items (80-120 per restaurant)');
  console.log('  - ~60 Modifier Groups & ~1,500 Modifier Options linked to items');
  console.log('  - ~60 Active Coupons (Percentage, Flat, Free Shipping)');
  console.log('  - ~40 Delivery Partners (Pathao, InDrive, Local, etc.)');
  console.log('  - ~40 Advertisements (Mix of ACTIVE and PENDING for admin approval testing)');
  console.log('  - 20 Storefront Configs (About, Contact, Section layout)');
  console.log('  - ~60 Storefront Banners (2-4 per restaurant for slider testing)');
  console.log('  - ~10 Storefront Popups (Time-bound discount offers)');
  console.log('  - ~40 Mock Orders with Order Items & Modifiers');
  console.log('  - ~100+ Customer Reviews');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });