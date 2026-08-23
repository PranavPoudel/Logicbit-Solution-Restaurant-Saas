import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogActivityParams {
  tenantId?: string;
  restaurantId?: string;
  actorType: 'OWNER' | 'CUSTOMER' | 'DELIVERY' | 'PLATFORM_ADMIN' | 'SYSTEM';
  actorId?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * ActivityLogService
 * --------------------
 * Global service — जुनसुकै module ले (Order, Menu, Storefront, Commission
 * बदल्दा) एक लाइनमा `this.activityLog.log(...)` call गरेर audit trail
 * बनाउन सक्छ। Super Admin dashboard ले यही data बाट प्रत्येक restaurant
 * को "activity feed" देखाउँछ।
 */
@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogActivityParams) {
    // Logging कहिल्यै मुख्य business logic लाई block/fail नगरोस् भनेर
    // silent-catch गरिएको छ — audit log fail भएर order creation जस्तो
    // महत्वपूर्ण operation नै असफल हुनु हुँदैन।
    try {
      await this.prisma.activityLog.create({
        data: {
          tenantId: params.tenantId,
          restaurantId: params.restaurantId,
          actorType: params.actorType,
          actorId: params.actorId,
          action: params.action,
          description: params.description,
          metadata: params.metadata,
        },
      });
    } catch {
      // Best-effort logging — fail भए silently ignore
    }
  }

  async findForRestaurant(restaurantId: string, action?: string, page = 1, limit = 50) {
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { restaurantId, ...(action ? { action } : {}) },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where: { restaurantId, ...(action ? { action } : {}) } }),
    ]);
    return { success: true, data: { logs, pagination: { page, limit, total } } };
  }

  async findAll(page = 1, limit = 50) {
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.activityLog.count(),
    ]);
    return { success: true, data: { logs, pagination: { page, limit, total } } };
  }
}
