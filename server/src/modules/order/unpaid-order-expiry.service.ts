import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from './order.service';

/** Gives up on card orders nobody paid for, so they do not sit as "Payment pending" forever. */
@Injectable()
export class UnpaidOrderExpiryService {
  private readonly logger = new Logger(UnpaidOrderExpiryService.name);
  private running = false;

  constructor(private readonly orderService: OrderService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run() {
    if (this.running) return; // a slow run must not overlap the next one
    this.running = true;
    try {
      const cancelled = await this.orderService.cancelExpiredUnpaidOrders();
      if (cancelled > 0) this.logger.log(`Cancelled ${cancelled} unpaid card order(s)`);
    } catch (error) {
      this.logger.error('Unpaid order cleanup failed', error as Error);
    } finally {
      this.running = false;
    }
  }
}
