import { Module } from '@nestjs/common';
import { AdminSubscriptionController } from './platform-admin-subscription.controller';
import { AdminSubscriptionService } from './platform-admin-subscription.service';
import { PrismaService } from '../..//prisma/prisma.service'; // Adjust path if necessary

@Module({
  controllers: [AdminSubscriptionController],
  providers: [AdminSubscriptionService, PrismaService],
})
export class AdminSubscriptionModule {}