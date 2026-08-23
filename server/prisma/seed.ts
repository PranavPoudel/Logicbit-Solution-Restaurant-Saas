import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * यो script ले platform को पहिलो-पटक setup (bootstrap) गर्छ:
 *  1. सबै PlatformPermission बनाउने (जुनसुकै @RequirePlatformPermission()
 *     decorator मा प्रयोग भएका नाम यहाँ हुनैपर्छ)
 *  2. "Full Admin" role बनाएर ती सबै permission assign गर्ने
 *  3. पहिलो PlatformStaff account बनाउने (.env बाट email/password लिएर)
 *
 * चलाउने तरिका: npm run prisma:seed
 */
const PERMISSIONS = [
  'VIEW_REVENUE',
  'VIEW_RESTAURANTS',
  'OVERRIDE_RESTAURANT_SETTINGS',
  'SUSPEND_RESTAURANT',
  'MANAGE_COMMISSION',
  'MODERATE_CONTENT',
  'VIEW_DELIVERIES',
  'VIEW_ACTIVITY_LOGS',
  'PROCESS_REFUNDS',
  'MANAGE_CUISINES',
  'MANAGE_SETTLEMENTS',
  'MANAGE_ADVERTISEMENTS',
  'MANAGE_PLATFORM_STAFF',
  'MANAGE_SUBSCRIPTIONS',
];

async function main() {
  console.log('Seeding platform permissions...');
  for (const name of PERMISSIONS) {
    await prisma.platformPermission.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Creating "Full Admin" role with all permissions...');
  const fullAdminRole = await prisma.platformRole.upsert({
    where: { name: 'Full Admin' },
    update: {},
    create: { name: 'Full Admin' },
  });

  const allPermissions = await prisma.platformPermission.findMany();
  for (const permission of allPermissions) {
    await prisma.platformRolePermission.upsert({
      where: { roleId_permissionId: { roleId: fullAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: fullAdminRole.id, permissionId: permission.id },
    });
  }

  const bootstrapEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@logicbit.local';
  const bootstrapPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existingStaff = await prisma.platformStaff.findUnique({ where: { email: bootstrapEmail } });
  if (!existingStaff) {
    const passwordHash = await bcrypt.hash(bootstrapPassword, 10);
    await prisma.platformStaff.create({
      data: { name: 'Platform Owner', email: bootstrapEmail, passwordHash, roleId: fullAdminRole.id },
    });
    console.log(`Bootstrap Platform Admin created: ${bootstrapEmail}`);
    console.log(`⚠️  Please login and change this password immediately.`);
  } else {
    console.log('Bootstrap Platform Admin already exists, skipping.');
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
